<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    private const STATUSES = [
        'pending',
        'processing',
        'ready_for_pickup',
        'shipped',
        'completed',
        'cancelled',
    ];

    public function index(Request $request): AnonymousResourceCollection
    {
        $search = trim((string) $request->query('search', ''));

        $orders = Order::query()
            ->with(['user', 'items', 'payments'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->query('status')))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('order_number', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($user) use ($search) {
                            $user->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->latest('id')
            ->paginate(20);

        return OrderResource::collection($orders);
    }

    public function updateStatus(Request $request, Order $order): OrderResource
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(self::STATUSES)],
        ]);

        if ($order->status === 'cancelled' && $data['status'] !== 'cancelled') {
            throw ValidationException::withMessages([
                'status' => ['A cancelled order cannot be reopened.'],
            ]);
        }

        DB::transaction(function () use ($order, $data) {
            if ($data['status'] === 'cancelled' && $order->status !== 'cancelled') {
                foreach ($order->items()->whereNotNull('product_variant_id')->get() as $item) {
                    ProductVariant::where('id', $item->product_variant_id)
                        ->increment('stock_quantity', $item->quantity);
                }
            }

            $order->status = $data['status'];
            $order->save();
        });

        return new OrderResource($order->load(['user', 'items', 'payments']));
    }

    public function updatePayment(Request $request, Order $order): OrderResource
    {
        $data = $request->validate([
            'status' => ['required', Rule::in([
                Payment::STATUS_PENDING,
                Payment::STATUS_PAID,
                Payment::STATUS_FAILED,
                Payment::STATUS_REFUNDED,
            ])],
        ]);

        $payment = $order->payments()->latest()->first();

        if (! $payment) {
            throw ValidationException::withMessages([
                'payment' => ['This order has no payment record.'],
            ]);
        }

        $payment->status = $data['status'];
        $payment->paid_at = $data['status'] === Payment::STATUS_PAID ? now() : null;
        $payment->save();

        return new OrderResource($order->load(['user', 'items', 'payments']));
    }
}
