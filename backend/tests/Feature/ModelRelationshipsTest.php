<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\Category;
use App\Models\Color;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Size;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelRelationshipsTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_relationships(): void
    {
        $category = Category::create([
            'name' => 'Classic Tees',
            'slug' => 'classic-tees',
            'is_active' => true,
        ]);

        $color = Color::create(['name' => 'Black', 'hex_code' => '#000000']);
        $size = Size::create(['name' => 'Medium', 'sort_order' => 2]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Everyday Tee',
            'slug' => 'everyday-tee',
            'is_active' => true,
            'is_featured' => true,
        ]);

        $image = $product->images()->create([
            'image_path' => 'products/everyday-tee.jpg',
            'is_primary' => true,
            'sort_order' => 1,
        ]);

        $variant = $product->variants()->create([
            'color_id' => $color->id,
            'size_id' => $size->id,
            'sku' => 'TEE-BLK-M',
            'price' => 299.00,
            'stock_quantity' => 25,
            'is_active' => true,
        ]);

        $this->assertTrue($product->category->is($category));
        $this->assertTrue($category->products->contains($product));
        $this->assertTrue($product->images->contains($image));
        $this->assertTrue($image->product->is($product));
        $this->assertTrue($product->variants->contains($variant));
        $this->assertTrue($variant->product->is($product));
        $this->assertTrue($variant->color->is($color));
        $this->assertTrue($variant->size->is($size));
        $this->assertTrue($color->productVariants->contains($variant));
        $this->assertTrue($size->productVariants->contains($variant));
        $this->assertSame('299.00', $variant->price);
        $this->assertSame(25, $variant->stock_quantity);
        $this->assertTrue($image->is_primary);
    }

    public function test_customer_cart_order_and_payment_relationships(): void
    {
        $user = User::create([
            'name' => 'Jane Customer',
            'email' => 'jane@example.com',
            'password' => 'password',
        ]);

        $address = $user->addresses()->create([
            'label' => 'Home',
            'recipient_name' => 'Jane Customer',
            'phone' => '09171234567',
            'address_line' => '123 Sample Street',
            'city' => 'Manila',
            'province' => 'Metro Manila',
            'postal_code' => '1000',
            'is_default' => true,
        ]);

        $cart = Cart::create(['user_id' => $user->id]);

        $category = Category::create(['name' => 'Classic Tees', 'slug' => 'classic-tees']);
        $color = Color::create(['name' => 'White']);
        $size = Size::create(['name' => 'Large']);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Everyday Tee',
            'slug' => 'everyday-tee',
        ]);

        $variant = $product->variants()->create([
            'color_id' => $color->id,
            'size_id' => $size->id,
            'sku' => 'TEE-WHT-L',
            'price' => 299.00,
            'stock_quantity' => 10,
        ]);

        $cartItem = $cart->items()->create([
            'product_variant_id' => $variant->id,
            'quantity' => 2,
        ]);

        $this->assertTrue($user->cart->is($cart));
        $this->assertTrue($cart->user->is($user));
        $this->assertTrue($cart->items->contains($cartItem));
        $this->assertTrue($cartItem->cart->is($cart));
        $this->assertTrue($cartItem->productVariant->is($variant));
        $this->assertTrue($variant->cartItems->contains($cartItem));
        $this->assertTrue($user->addresses->contains($address));
        $this->assertTrue($address->user->is($user));
        $this->assertTrue($address->is_default);

        $order = new Order([
            'user_id' => $user->id,
            'payment_method' => Payment::METHOD_GCASH,
            'delivery_method' => 'delivery',
            'delivery_recipient_name' => $address->recipient_name,
            'delivery_phone' => $address->phone,
            'delivery_address_line' => $address->address_line,
            'delivery_city' => $address->city,
            'delivery_province' => $address->province,
            'delivery_postal_code' => $address->postal_code,
        ]);
        $order->order_number = 'ORD-2026-0001';
        $order->status = 'pending';
        $order->subtotal = 598.00;
        $order->shipping_fee = 50.00;
        $order->total = 648.00;
        $order->placed_at = now();
        $order->save();

        $orderItem = $order->items()->create([
            'product_variant_id' => $variant->id,
            'product_name' => $product->name,
            'sku' => $variant->sku,
            'color_name' => $color->name,
            'size_name' => $size->name,
            'unit_price' => $variant->price,
            'quantity' => 2,
            'line_total' => 598.00,
        ]);

        $payment = $order->payments()->create([
            'method' => Payment::METHOD_GCASH,
            'amount' => 648.00,
            'reference_number' => 'GCASH-123456',
        ]);

        $this->assertTrue($user->orders->contains($order));
        $this->assertTrue($order->user->is($user));
        $this->assertTrue($order->items->contains($orderItem));
        $this->assertTrue($orderItem->order->is($order));
        $this->assertTrue($orderItem->productVariant->is($variant));
        $this->assertTrue($variant->orderItems->contains($orderItem));
        $this->assertTrue($order->payments->contains($payment));
        $this->assertTrue($payment->order->is($order));
        $this->assertSame('648.00', $payment->amount);
        $this->assertSame(Payment::STATUS_PENDING, $payment->fresh()->status);

        $variant->delete();

        $orderItem->refresh();

        $this->assertNull($orderItem->product_variant_id);
        $this->assertNull($orderItem->productVariant);
        $this->assertDatabaseHas('order_items', ['id' => $orderItem->id, 'product_name' => 'Everyday Tee']);
        $this->assertSame('123 Sample Street', $order->fresh()->delivery_address_line);
    }

    public function test_product_uses_soft_deletes_and_user_has_sanctum_tokens(): void
    {
        $user = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $token = $user->createToken('postman')->plainTextToken;

        $this->assertNotEmpty($token);
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'tokenable_type' => User::class,
        ]);

        $category = Category::create(['name' => 'Classic Tees', 'slug' => 'classic-tees']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Everyday Tee',
            'slug' => 'everyday-tee',
        ]);

        $product->delete();

        $this->assertSoftDeleted('products', ['id' => $product->id]);
        $this->assertNull(Product::find($product->id));
        $this->assertNotNull(Product::withTrashed()->find($product->id));
    }
}
