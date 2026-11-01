<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoOrderSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'customer@threadco.test')->first();

        if (! $customer || $customer->orders()->exists()) {
            return;
        }

        $address = $customer->addresses()->where('is_default', true)->first()
            ?? $customer->addresses()->first();
        $variants = ProductVariant::with(['product', 'color', 'size'])
            ->where('is_active', true)
            ->take(3)
            ->get();

        if (! $address || $variants->count() < 2) {
            return;
        }

        $completedVariant = $variants[0];
        $completedSubtotal = round((float) $completedVariant->price * 2, 2);

        $completed = new Order([
            'user_id' => $customer->id,
            'payment_method' => Payment::METHOD_GCASH,
            'delivery_method' => 'delivery',
            'delivery_recipient_name' => $address->recipient_name,
            'delivery_phone' => $address->phone,
            'delivery_address_line' => $address->address_line,
            'delivery_city' => $address->city,
            'delivery_province' => $address->province,
            'delivery_postal_code' => $address->postal_code,
            'notes' => 'Please leave with the guard if I am not home.',
        ]);
        $completed->order_number = 'ORD-DEMO-0001';
        $completed->status = 'completed';
        $completed->subtotal = $completedSubtotal;
        $completed->shipping_fee = 50;
        $completed->total = round($completedSubtotal + 50, 2);
        $completed->placed_at = now()->subDays(5);
        $completed->created_at = now()->subDays(5);
        $completed->updated_at = now()->subDays(4);
        $completed->save();

        $completed->items()->create([
            'product_variant_id' => $completedVariant->id,
            'product_name' => $completedVariant->product->name,
            'sku' => $completedVariant->sku,
            'color_name' => $completedVariant->color?->name,
            'size_name' => $completedVariant->size?->name,
            'unit_price' => $completedVariant->price,
            'quantity' => 2,
            'line_total' => $completedSubtotal,
        ]);

        $completedPayment = $completed->payments()->create([
            'method' => Payment::METHOD_GCASH,
            'amount' => $completed->total,
            'reference_number' => 'GCASH-DEMO-0001',
        ]);
        $completedPayment->status = Payment::STATUS_PAID;
        $completedPayment->paid_at = now()->subDays(5);
        $completedPayment->save();

        $pendingVariant = $variants[1];
        $pendingSubtotal = (float) $pendingVariant->price;

        $pending = new Order([
            'user_id' => $customer->id,
            'payment_method' => Payment::METHOD_COD,
            'delivery_method' => 'pickup',
        ]);
        $pending->order_number = 'ORD-DEMO-0002';
        $pending->status = 'pending';
        $pending->subtotal = $pendingSubtotal;
        $pending->shipping_fee = 0;
        $pending->total = $pendingSubtotal;
        $pending->placed_at = now()->subHours(6);
        $pending->save();

        $pending->items()->create([
            'product_variant_id' => $pendingVariant->id,
            'product_name' => $pendingVariant->product->name,
            'sku' => $pendingVariant->sku,
            'color_name' => $pendingVariant->color?->name,
            'size_name' => $pendingVariant->size?->name,
            'unit_price' => $pendingVariant->price,
            'quantity' => 1,
            'line_total' => $pendingSubtotal,
        ]);

        $pending->payments()->create([
            'method' => Payment::METHOD_COD,
            'amount' => $pending->total,
        ]);
    }
}
