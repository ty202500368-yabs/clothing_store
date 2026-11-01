<?php

namespace Tests\Feature\Api;

use App\Models\Order;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_admin_can_view_dashboard_orders_and_products(): void
    {
        Sanctum::actingAs($this->admin());

        $this->getJson('/api/admin/stats')
            ->assertOk()
            ->assertJsonStructure(['stats' => ['revenue', 'orders', 'pending_orders', 'low_stock', 'customers'], 'recent_orders']);

        $this->getJson('/api/admin/orders')
            ->assertOk()
            ->assertJsonStructure(['data' => [['order_number', 'status', 'items', 'payments', 'user']]]);

        $this->getJson('/api/admin/products')
            ->assertOk()
            ->assertJsonStructure(['data' => [['name', 'variants', 'category']]]);
    }

    public function test_admin_can_update_order_status_and_payment(): void
    {
        Sanctum::actingAs($this->admin());

        $order = Order::where('status', 'pending')->firstOrFail();
        $variant = $order->items()->firstOrFail()->productVariant;
        $stockBefore = $variant->stock_quantity;
        $quantity = $order->items()->firstOrFail()->quantity;

        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'processing'])
            ->assertOk()
            ->assertJsonPath('data.status', 'processing');

        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'cancelled'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertSame($stockBefore + $quantity, $variant->fresh()->stock_quantity);

        $this->patchJson("/api/admin/orders/{$order->id}/payment", ['status' => Payment::STATUS_PAID])
            ->assertOk()
            ->assertJsonPath('data.payments.0.status', Payment::STATUS_PAID)
            ->assertJsonPath('data.payments.0.paid_at', fn ($value) => $value !== null);
    }

    public function test_admin_can_update_variant_inventory_and_product_visibility(): void
    {
        Sanctum::actingAs($this->admin());

        $variant = ProductVariant::firstOrFail();

        $this->patchJson("/api/admin/variants/{$variant->id}", [
            'price' => 777.50,
            'stock_quantity' => 42,
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.price', 777.5)
            ->assertJsonPath('data.stock_quantity', 42)
            ->assertJsonPath('data.is_active', false);

        $this->patchJson('/api/admin/products/'.$variant->product_id, [
            'is_featured' => true,
            'is_active' => false,
        ])->assertOk()
            ->assertJsonPath('data.is_featured', true)
            ->assertJsonPath('data.is_active', false);
    }

    public function test_non_admin_cannot_access_admin_endpoints(): void
    {
        Sanctum::actingAs(User::where('email', 'customer@threadco.test')->firstOrFail());

        $this->getJson('/api/admin/stats')->assertForbidden();
        $this->getJson('/api/admin/orders')->assertForbidden();
        $this->getJson('/api/admin/products')->assertForbidden();
    }

    private function admin(): User
    {
        return User::where('email', 'admin@threadco.test')->firstOrFail();
    }
}
