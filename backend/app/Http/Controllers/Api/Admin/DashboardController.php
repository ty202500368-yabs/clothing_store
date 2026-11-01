<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $recentOrders = Order::query()
            ->with(['user', 'items', 'payments'])
            ->latest('id')
            ->limit(6)
            ->get();

        return response()->json([
            'stats' => [
                'revenue' => (float) Payment::where('status', Payment::STATUS_PAID)->sum('amount'),
                'orders' => Order::count(),
                'pending_orders' => Order::where('status', 'pending')->count(),
                'low_stock' => ProductVariant::where('is_active', true)->where('stock_quantity', '<=', 5)->count(),
                'customers' => User::where('role', User::ROLE_CUSTOMER)->count(),
            ],
            'recent_orders' => OrderResource::collection($recentOrders),
        ]);
    }
}
