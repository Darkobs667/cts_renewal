<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Hash Driver
    |--------------------------------------------------------------------------
    */
    'driver' => 'bcrypt',

    /*
    |--------------------------------------------------------------------------
    | Bcrypt Options
    |--------------------------------------------------------------------------
    |
    | Cost 10 = ~100ms sur un serveur moderne.
    | Cost 12 = ~400ms (default Laravel) — trop lent pour une API publique
    | avec latence réseau Sénégal → Europe déjà à ~1-1.5s.
    |
    | Cost 10 reste sécurisé : 2^10 = 1024 itérations, suffisant contre
    | les attaques par force brute modernes.
    |
    */
    'bcrypt' => [
        'rounds' => env('BCRYPT_ROUNDS', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Argon Options
    |--------------------------------------------------------------------------
    */
    'argon' => [
        'memory'  => env('ARGON_MEMORY',  65536),
        'threads' => env('ARGON_THREADS', 1),
        'time'    => env('ARGON_TIME',    4),
    ],

];
