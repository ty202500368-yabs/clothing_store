<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = min(max((int) $request->query('per_page', 12), 1), 48);

        $products = Product::query()
            ->where('is_active', true)
            ->with([
                'category',
                'images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order'),
                'variants' => fn ($query) => $query->where('is_active', true)->with(['color', 'size']),
            ])
            ->withMin('variants', 'price')
            ->withMax('variants', 'price')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('category'), function ($query) use ($request) {
                $query->whereHas('category', fn ($category) => $category->where('slug', $request->query('category')));
            })
            ->when($request->filled('color_id'), function ($query) use ($request) {
                $query->whereHas('variants', fn ($variant) => $variant
                    ->where('is_active', true)
                    ->where('color_id', $request->integer('color_id')));
            })
            ->when($request->filled('size_id'), function ($query) use ($request) {
                $query->whereHas('variants', fn ($variant) => $variant
                    ->where('is_active', true)
                    ->where('size_id', $request->integer('size_id')));
            })
            ->when($request->boolean('featured'), fn ($query) => $query->where('is_featured', true));

        match ($request->query('sort')) {
            'price_asc' => $products->orderBy('variants_min_price'),
            'price_desc' => $products->orderByDesc('variants_max_price'),
            'newest' => $products->latest(),
            default => $products->orderByDesc('is_featured')->latest(),
        };

        return ProductResource::collection($products->paginate($perPage)->withQueryString());
    }

    public function show(Product $product): ProductResource
    {
        abort_unless($product->is_active, 404);

        $product->load([
            'category',
            'images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order'),
            'variants' => fn ($query) => $query->where('is_active', true)->with(['color', 'size']),
        ]);

        return new ProductResource($product);
    }
}
