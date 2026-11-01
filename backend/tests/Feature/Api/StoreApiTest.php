<?php

namespace Tests\Feature\Api;

use App\Models\Cart;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StoreApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_customer_can_register_login_and_view_profile(): void
    {
        $register = $this->postJson('/api/register', [
            'name' => 'New Customer',
            'email' => 'new@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $register->assertCreated()
            ->assertJsonPath('user.email', 'new@example.com')
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'role', 'is_admin'], 'token']);

        $login = $this->postJson('/api/login', [
            'email' => 'customer@threadco.test',
            'password' => 'password',
        ]);

        $login->assertOk()->assertJsonStructure(['user', 'token']);

        $this->withHeader('Authorization', 'Bearer '.$login->json('token'))
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.email', 'customer@threadco.test');

        $this->withHeader('Authorization', 'Bearer '.$login->json('token'))
            ->postJson('/api/logout')
            ->assertOk();
    }

    public function test_invalid_login_is_rejected(): void
    {
        $this->postJson('/api/login', [
            'email' => 'customer@threadco.test',
            'password' => 'wrong-password',
        ])->assertUnprocessable();
    }

    public function test_products_catalog_and_filters_are_public(): void
    {
        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'slug', 'category', 'images', 'variants', 'min_price']],
                'meta',
                'links',
            ]);

        $this->getJson('/api/products?category=oversized&sort=price_asc')
            ->assertOk()
            ->assertJsonPath('data.0.category.slug', 'oversized');

        $this->getJson('/api/products?search=premium')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Premium Pima Cotton Tee');

        $this->getJson('/api/products/essential-crew-neck-tee')
            ->assertOk()
            ->assertJsonPath('data.slug', 'essential-crew-neck-tee')
            ->assertJsonStructure(['data' => ['variants' => [['color', 'size', 'price']], 'images']]);

        $this->getJson('/api/catalog')
            ->assertOk()
            ->assertJsonStructure(['categories', 'colors', 'sizes']);
    }

    public function test_customer_can_manage_cart(): void
    {
        $user = User::where('email', 'customer@threadco.test')->firstOrFail();
        $variant = ProductVariant::where('stock_quantity', '>=', 5)->firstOrFail();

        Sanctum::actingAs($user);

        $this->getJson('/api/cart')->assertOk()->assertJsonPath('data.total_items', 0);

        $this->postJson('/api/cart/items', [
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ])->assertOk()
            ->assertJsonPath('data.total_items', 2)
            ->assertJsonPath('data.items.0.quantity', 2)
            ->assertJsonPath('data.items.0.product_variant.sku', $variant->sku);

        $cartItemId = $this->getJson('/api/cart')->json('data.items.0.id');

        $this->patchJson("/api/cart/items/{$cartItemId}", ['quantity' => 3])
            ->assertOk()
            ->assertJsonPath('data.total_items', 3);

        $this->deleteJson("/api/cart/items/{$cartItemId}")
            ->assertOk()
            ->assertJsonPath('data.total_items', 0);
    }

    public function test_checkout_delivery_with_gcash_creates_order_and_updates_inventory(): void
    {
        $user = User::where('email', 'customer@threadco.test')->firstOrFail();
        $address = $user->addresses()->where('is_default', true)->firstOrFail();
        $variant = ProductVariant::where('stock_quantity', '>=', 3)->firstOrFail();
        $stockBefore = $variant->stock_quantity;
        $orderCountBefore = Order::count();

        Sanctum::actingAs($user);

        $this->postJson('/api/cart/items', [
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ])->assertOk();

        $response = $this->postJson('/api/orders', [
            'delivery_method' => 'delivery',
            'payment_method' => 'gcash',
            'address_id' => $address->id,
            'gcash_reference' => 'GCASH-TEST-001',
            'notes' => 'Leave at the front desk.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.delivery_method', 'delivery')
            ->assertJsonPath('data.payment_method', 'gcash')
            ->assertJsonPath('data.delivery_address_line', $address->address_line)
            ->assertJsonPath('data.payments.0.status', 'pending')
            ->assertJsonPath('data.items.0.quantity', 2);

        $this->assertSame($orderCountBefore + 1, Order::count());
        $this->assertSame($stockBefore - 2, $variant->fresh()->stock_quantity);
        $this->assertSame(0, Cart::where('user_id', $user->id)->firstOrFail()->items()->count());
        $this->assertSame(
            round((float) $variant->price * 2 + 50, 2),
            (float) $response->json('data.total')
        );

        $this->getJson('/api/orders')
            ->assertOk()
            ->assertJsonPath('data.0.order_number', $response->json('data.order_number'));

        $this->getJson('/api/orders/'.$response->json('data.id'))
            ->assertOk()
            ->assertJsonPath('data.payments.0.reference_number', 'GCASH-TEST-001');
    }

    public function test_checkout_pickup_with_cod_has_no_shipping_fee(): void
    {
        $user = User::where('email', 'customer@threadco.test')->firstOrFail();
        $variant = ProductVariant::where('stock_quantity', '>=', 1)->firstOrFail();

        Sanctum::actingAs($user);

        $this->postJson('/api/cart/items', [
            'product_variant_id' => $variant->id,
            'quantity' => 1,
        ])->assertOk();

        $response = $this->postJson('/api/orders', [
            'delivery_method' => 'pickup',
            'payment_method' => 'cod',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.shipping_fee', 0)
            ->assertJsonPath('data.delivery_method', 'pickup')
            ->assertJsonPath('data.payments.0.method', 'cod');

        $this->assertSame(round((float) $variant->price, 2), round((float) $response->json('data.total'), 2));
    }

    public function test_checkout_requires_items_and_delivery_address(): void
    {
        $user = User::where('email', 'customer@threadco.test')->firstOrFail();
        Sanctum::actingAs($user);

        $this->postJson('/api/orders', [
            'delivery_method' => 'delivery',
            'payment_method' => 'cod',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['address_id']);

        $this->postJson('/api/orders', [
            'delivery_method' => 'pickup',
            'payment_method' => 'cod',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['cart']);
    }

    public function test_customer_cannot_view_another_customers_order(): void
    {
        $order = Order::firstOrFail();
        $otherUser = User::create([
            'name' => 'Other Customer',
            'email' => 'other@example.com',
            'password' => 'password',
        ]);

        Sanctum::actingAs($otherUser);

        $this->getJson('/api/orders/'.$order->id)->assertForbidden();
    }
}
