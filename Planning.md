Task: Implement Eloquent Models and Relationships for My T-Shirt E-commerce Website

I am developing a full-stack e-commerce website for my own clothing brand, which sells ready-made T-shirts.

Technology Stack

Frontend: React.js

Backend: Laravel (PHP)

Database: MySQL

API Testing: Postman

Authentication: Laravel Sanctum

Project Overview

The system is a single-brand T-shirt online store where customers can browse products, select sizes and colors, add items to their cart, place orders, and choose between store pickup and delivery.

There are two user roles:

Customer: Can browse products, manage their cart, place orders, and view their order history.

Administrator: Can manage products, categories, sizes, colors, inventory, orders, and payments.

Products have multiple variants based on size and color. Each variant has its own SKU, price, and available stock quantity.

Existing Database Tables

The database schema has already been planned with the following tables:

users

categories

colors

sizes

products

product_images

product_variants

addresses

carts

cart_items

orders

order_items

payments

Do not redesign the database unnecessarily. Follow the existing table structure and inspect the actual Laravel migration files before implementing the models.

Main Task: Create Eloquent Models

Create and configure the following models inside app/Models/:

User.php

Category.php

Color.php

Size.php

Product.php

ProductImage.php

ProductVariant.php

Address.php

Cart.php

CartItem.php

Order.php

OrderItem.php

Payment.php

Required Eloquent Relationships

Implement the correct relationships between the models.

User

Has many orders.

Has one cart.

Has many addresses.

Category

Has many products.

Product

Belongs to a category.

Has many product images.

Has many product variants.

ProductImage

Belongs to a product.

ProductVariant

Belongs to a product.

Belongs to a color.

Belongs to a size.

Can appear in many cart items.

Can appear in many order items.

Color

Has many product variants.

Size

Has many product variants.

Address

Belongs to a user.

Cart

Belongs to a user.

Has many cart items.

CartItem

Belongs to a cart.

Belongs to a product variant.

Order

Belongs to a user.

Has many order items.

Has many payments.

OrderItem

Belongs to an order.

Belongs to a product variant, but the relationship must allow a nullable variant because historical order records should remain valid even if a product variant is deleted.

Payment

Belongs to an order.

Implementation Requirements

Inspect the existing migrations first to confirm table names, foreign keys, column names, nullable fields, and data types.

Create the models using Laravel's Eloquent ORM.

Define all required relationships using the appropriate methods:

hasOne()

hasMany()

belongsTo()

Configure $fillable or $guarded appropriately.

Configure $casts for relevant fields, such as:

Boolean values (is_active, is_featured, is_primary, is_default)

Decimal prices and monetary values

Integer quantities and stock

Date/time fields where appropriate

Configure the User model to work with Laravel Sanctum authentication.

Configure soft deletes on the Product model if the existing migration includes softDeletes().

Use proper namespaces and imports.

Follow Laravel coding conventions and maintain clean, readable code.

Avoid unnecessary packages or additional dependencies.

Important Business Logic Considerations

A product can have multiple size and color combinations.

Each product variant must have its own unique SKU.

Product prices and inventory quantities belong to product_variants, not directly to products.

Cart items should reference product variants.

Order items must preserve product information at the time of purchase, including product name, SKU, color, size, unit price, quantity, and line total.

Order records should preserve delivery address information even if the customer's saved address changes later.

Payments should support GCash and Cash on Delivery (COD).

Do not trust payment status or prices submitted by the React frontend. These must be validated on the Laravel backend.

Expected Deliverables

All 13 Eloquent model files.

Proper model relationships.

Appropriate fillable or guarded attributes.

Appropriate casts.

Necessary Sanctum configuration for the User model.

A brief explanation of each model and its relationships.

Example Eloquent queries demonstrating:

Retrieving products with categories, images, and variants.

Retrieving variants with their sizes and colors.

Retrieving a customer's cart with cart items and product details.

Retrieving a customer's orders with order items and payments.

Important Instructions for the AI Coding Agent

First inspect the existing project structure and migration files.

Do not overwrite or delete existing working code without a clear reason.

Do not create duplicate migrations or database tables.

Do not modify the frontend yet.

Follow the existing project conventions.

If something in the database schema does not match the requested relationships, explain the issue before making changes.

Implement the models and relationships, then verify that the code is syntactically correct.

At the end, provide a summary of all files created or modified and explain how I can test the relationships.

Work directly within the existing Laravel backend project.