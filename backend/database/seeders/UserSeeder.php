<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(['email' => 'admin@threadco.test'], [
            'name' => 'Store Admin',
            'password' => 'password',
        ]);
        $admin->role = User::ROLE_ADMIN;
        $admin->email_verified_at = now();
        $admin->save();

        $customer = User::updateOrCreate(['email' => 'customer@threadco.test'], [
            'name' => 'Jane Customer',
            'password' => 'password',
        ]);
        $customer->role = User::ROLE_CUSTOMER;
        $customer->email_verified_at = now();
        $customer->save();

        $customer->addresses()->updateOrCreate(['label' => 'Home'], [
            'recipient_name' => 'Jane Customer',
            'phone' => '09171234567',
            'address_line' => '123 Sample Street, Barangay San Antonio',
            'city' => 'Pasig City',
            'province' => 'Metro Manila',
            'postal_code' => '1600',
            'is_default' => true,
        ]);
    }
}
