<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return (new CartResource($this->loadCart($this->cartFor($request->user()))))
            ->response()
            ->setStatusCode(200);
    }

    public function storeItem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $variant = ProductVariant::with('product')->findOrFail($data['product_variant_id']);

        if (! $variant->is_active || ! $variant->product || ! $variant->product->is_active) {
            throw ValidationException::withMessages([
                'product_variant_id' => ['This product variant is not available.'],
            ]);
        }

        $cart = $this->cartFor($request->user());
        $item = $cart->items()->where('product_variant_id', $variant->id)->first();
        $quantity = ($item?->quantity ?? 0) + $data['quantity'];

        if ($quantity > $variant->stock_quantity) {
            throw ValidationException::withMessages([
                'quantity' => ["Only {$variant->stock_quantity} item(s) are available."],
            ]);
        }

        if ($item) {
            $item->update(['quantity' => $quantity]);
        } else {
            $cart->items()->create([
                'product_variant_id' => $variant->id,
                'quantity' => $quantity,
            ]);
        }

        return (new CartResource($this->loadCart($cart->fresh())))->response()->setStatusCode(200);
    }

    public function updateItem(Request $request, CartItem $cartItem): CartResource
    {
        $this->authorizeCartItem($request, $cartItem);

        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $variant = $cartItem->productVariant()->with('product')->first();

        if (! $variant || ! $variant->is_active || ! $variant->product || ! $variant->product->is_active) {
            throw ValidationException::withMessages([
                'quantity' => ['This product variant is no longer available.'],
            ]);
        }

        if ($data['quantity'] > $variant->stock_quantity) {
            throw ValidationException::withMessages([
                'quantity' => ["Only {$variant->stock_quantity} item(s) are available."],
            ]);
        }

        $cartItem->update(['quantity' => $data['quantity']]);

        return new CartResource($this->loadCart($cartItem->cart->fresh()));
    }

    public function destroyItem(Request $request, CartItem $cartItem): CartResource
    {
        $this->authorizeCartItem($request, $cartItem);

        $cart = $cartItem->cart;
        $cartItem->delete();

        return new CartResource($this->loadCart($cart->fresh()));
    }

    public function clear(Request $request): JsonResponse
    {
        $cart = $this->cartFor($request->user());
        $cart->items()->delete();

        return response()->json([
            'data' => new CartResource($this->loadCart($cart->fresh())),
        ]);
    }

    private function cartFor(User $user): Cart
    {
        return Cart::firstOrCreate(['user_id' => $user->id]);
    }

    private function loadCart(Cart $cart): Cart
    {
        return $cart->load([
            'items' => fn ($query) => $query->orderBy('id'),
            'items.productVariant.product.images' => fn ($query) => $query
                ->orderByDesc('is_primary')
                ->orderBy('sort_order'),
            'items.productVariant.color',
            'items.productVariant.size',
        ]);
    }

    private function authorizeCartItem(Request $request, CartItem $cartItem): void
    {
        abort_unless($cartItem->cart?->user_id === $request->user()->id, 403);
    }
}
