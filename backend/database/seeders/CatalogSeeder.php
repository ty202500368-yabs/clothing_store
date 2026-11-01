<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Color;
use App\Models\Product;
use App\Models\Size;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Classic Tees', 'slug' => 'classic-tees', 'description' => 'Timeless everyday essentials.'],
            ['name' => 'Oversized', 'slug' => 'oversized', 'description' => 'Relaxed fits with room to move.'],
            ['name' => 'Graphic Tees', 'slug' => 'graphic-tees', 'description' => 'Statement pieces with original artwork.'],
            ['name' => 'Premium Basics', 'slug' => 'premium-basics', 'description' => 'Elevated fabrics and refined details.'],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(['slug' => $category['slug']], [
                'name' => $category['name'],
                'description' => $category['description'],
                'is_active' => true,
            ]);
        }

        $colors = [
            ['name' => 'Black', 'hex_code' => '#111111'],
            ['name' => 'White', 'hex_code' => '#F5F3EE'],
            ['name' => 'Sand', 'hex_code' => '#D8C3A5'],
            ['name' => 'Olive', 'hex_code' => '#6B705C'],
            ['name' => 'Navy', 'hex_code' => '#1F2A44'],
            ['name' => 'Burgundy', 'hex_code' => '#6D1A36'],
        ];

        foreach ($colors as $color) {
            Color::updateOrCreate(['name' => $color['name']], $color);
        }

        $sizes = [
            ['name' => 'XS', 'sort_order' => 1],
            ['name' => 'S', 'sort_order' => 2],
            ['name' => 'M', 'sort_order' => 3],
            ['name' => 'L', 'sort_order' => 4],
            ['name' => 'XL', 'sort_order' => 5],
            ['name' => 'XXL', 'sort_order' => 6],
        ];

        foreach ($sizes as $size) {
            Size::updateOrCreate(['name' => $size['name']], $size);
        }

        $image = fn (string $id) => "https://images.unsplash.com/{$id}?auto=format&fit=crop&w=900&q=80";

        $products = [
            [
                'name' => 'Essential Crew Neck Tee',
                'slug' => 'essential-crew-neck-tee',
                'category' => 'classic-tees',
                'price' => 499,
                'featured' => true,
                'description' => 'A clean, everyday crew neck cut from soft combed cotton. The kind of tee you reach for without thinking.',
                'colors' => ['Black', 'White', 'Sand'],
                'images' => [$image('photo-1521572163474-6864f9cf17ab'), $image('photo-1583743814966-8936f5b7be1a')],
            ],
            [
                'name' => 'Oversized Heavyweight Tee',
                'slug' => 'oversized-heavyweight-tee',
                'category' => 'oversized',
                'price' => 699,
                'featured' => true,
                'description' => 'Dropped shoulders, a boxy body, and heavyweight cotton that holds its shape all day.',
                'colors' => ['Black', 'Olive', 'Sand'],
                'images' => [$image('photo-1503341504253-dff4815485f1'), $image('photo-1618354691373-d851c5c3a990')],
            ],
            [
                'name' => 'Midnight Graphic Tee',
                'slug' => 'midnight-graphic-tee',
                'category' => 'graphic-tees',
                'price' => 599,
                'featured' => false,
                'description' => 'A limited-run graphic inspired by late-night city drives. Printed with water-based ink for a soft hand feel.',
                'colors' => ['Black', 'Navy'],
                'images' => [$image('photo-1576566588028-4147f3842f27'), $image('photo-1562157873-818bc0726f68')],
            ],
            [
                'name' => 'Sunset Graphic Tee',
                'slug' => 'sunset-graphic-tee',
                'category' => 'graphic-tees',
                'price' => 599,
                'featured' => false,
                'description' => 'Warm gradients and a relaxed fit. An easy layer for weekends and everything after.',
                'colors' => ['White', 'Burgundy'],
                'images' => [$image('photo-1603252109303-2751441dd157'), $image('photo-1529374255404-311a2a4f1fd9')],
            ],
            [
                'name' => 'Premium Pima Cotton Tee',
                'slug' => 'premium-pima-cotton-tee',
                'category' => 'premium-basics',
                'price' => 899,
                'featured' => true,
                'description' => 'Our most refined basic, made with long-staple Pima cotton for a smooth, durable finish.',
                'colors' => ['White', 'Navy', 'Black'],
                'images' => [$image('photo-1622445275576-721325763afe'), $image('photo-1581655353564-df123a1eb820')],
            ],
            [
                'name' => 'Relaxed Pocket Tee',
                'slug' => 'relaxed-pocket-tee',
                'category' => 'oversized',
                'price' => 649,
                'featured' => false,
                'description' => 'A relaxed silhouette with a subtle chest pocket and a lived-in wash.',
                'colors' => ['Olive', 'Sand', 'Navy'],
                'images' => [$image('photo-1583743814966-8936f5b7be1a'), $image('photo-1521572163474-6864f9cf17ab')],
            ],
            [
                'name' => 'Everyday V-Neck Tee',
                'slug' => 'everyday-v-neck-tee',
                'category' => 'classic-tees',
                'price' => 549,
                'featured' => false,
                'description' => 'A gently tapered V-neck that layers cleanly under overshirts and jackets.',
                'colors' => ['White', 'Black'],
                'images' => [$image('photo-1562157873-818bc0726f68'), $image('photo-1576566588028-4147f3842f27')],
            ],
            [
                'name' => 'Vintage Wash Tee',
                'slug' => 'vintage-wash-tee',
                'category' => 'premium-basics',
                'price' => 749,
                'featured' => false,
                'description' => 'Garment-dyed for a faded, vintage look with a soft broken-in feel from the first wear.',
                'colors' => ['Burgundy', 'Olive'],
                'images' => [$image('photo-1618354691373-d851c5c3a990'), $image('photo-1503341504253-dff4815485f1')],
            ],
            [
                'name' => 'Monochrome Box Tee',
                'slug' => 'monochrome-box-tee',
                'category' => 'graphic-tees',
                'price' => 629,
                'featured' => false,
                'description' => 'A minimal box logo on a structured cotton tee. Understated by design.',
                'colors' => ['Black', 'White'],
                'images' => [$image('photo-1581655353564-df123a1eb820'), $image('photo-1622445275576-721325763afe')],
            ],
            [
                'name' => 'Weekend Boxy Tee',
                'slug' => 'weekend-boxy-tee',
                'category' => 'oversized',
                'price' => 679,
                'featured' => false,
                'description' => 'A boxy cut with a slightly cropped length, made for slow mornings and easy afternoons.',
                'colors' => ['Sand', 'Navy', 'White'],
                'images' => [$image('photo-1529374255404-311a2a4f1fd9'), $image('photo-1603252109303-2751441dd157')],
            ],
        ];

        $allSizes = Size::orderBy('sort_order')->get();

        foreach ($products as $index => $productData) {
            $category = Category::where('slug', $productData['category'])->firstOrFail();

            $product = Product::updateOrCreate(['slug' => $productData['slug']], [
                'category_id' => $category->id,
                'name' => $productData['name'],
                'description' => $productData['description'],
                'is_active' => true,
                'is_featured' => $productData['featured'],
            ]);

            foreach ($productData['images'] as $imageIndex => $path) {
                $product->images()->updateOrCreate(['image_path' => $path], [
                    'alt_text' => $productData['name'],
                    'is_primary' => $imageIndex === 0,
                    'sort_order' => $imageIndex,
                ]);
            }

            foreach ($productData['colors'] as $colorName) {
                $color = Color::where('name', $colorName)->firstOrFail();

                foreach ($allSizes as $sizeIndex => $size) {
                    $sku = 'TC-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT)
                        .'-'.strtoupper(substr($color->name, 0, 3))
                        .'-'.$size->name;

                    $product->variants()->updateOrCreate(['sku' => $sku], [
                        'color_id' => $color->id,
                        'size_id' => $size->id,
                        'price' => $productData['price'],
                        'stock_quantity' => 8 + (($index + $sizeIndex) % 5) * 6,
                        'is_active' => true,
                    ]);
                }
            }
        }
    }
}
