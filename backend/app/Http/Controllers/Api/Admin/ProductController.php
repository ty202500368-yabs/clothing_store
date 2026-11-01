<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $search = trim((string) $request->query('search', ''));

        $products = Product::query()
            ->with([
                'category',
                'images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order'),
                'variants' => fn ($query) => $query->with(['color', 'size']),
            ])
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->latest()
            ->paginate(20);

        return ProductResource::collection($products);
    }

    public function update(Request $request, Product $product): ProductResource
    {
        $data = $request->validate([
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($product->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
        ]);

        $product->update($data);
        $product->load(['category', 'images', 'variants.color', 'variants.size']);

        return new ProductResource($product);
    }

    public function updateVariant(Request $request, ProductVariant $variant): ProductVariantResource
    {
        $data = $request->validate([
            'price' => ['sometimes', 'required', 'numeric', 'min:0', 'max:999999.99'],
            'stock_quantity' => ['sometimes', 'required', 'integer', 'min:0', 'max:1000000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $variant->update($data);
        $variant->load(['color', 'size']);

        return new ProductVariantResource($variant);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(['message' => 'Product archived.']);
    }
}
