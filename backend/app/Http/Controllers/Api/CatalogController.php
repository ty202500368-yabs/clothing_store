<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ColorResource;
use App\Http\Resources\SizeResource;
use App\Models\Category;
use App\Models\Color;
use App\Models\Size;
use Illuminate\Http\JsonResponse;

class CatalogController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->where('is_active', true)
            ->withCount(['products' => fn ($query) => $query->where('is_active', true)])
            ->orderBy('name')
            ->get();

        $colors = Color::query()
            ->withCount(['productVariants' => fn ($query) => $query->where('is_active', true)])
            ->orderBy('name')
            ->get();

        $sizes = Size::query()
            ->withCount(['productVariants' => fn ($query) => $query->where('is_active', true)])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'categories' => CategoryResource::collection($categories),
            'colors' => ColorResource::collection($colors),
            'sizes' => SizeResource::collection($sizes),
        ]);
    }
}
