<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
    {
        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('position_id')
                  ->constrained()
                  ->onDelete('cascade');

            $table->foreignId('candidate_id')
                  ->nullable()
                  ->constrained()
                  ->nullOnDelete();

            $table->string('hash_session');

            $table->timestamps();

            
            $table->unique(['position_id', 'hash_session']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};
