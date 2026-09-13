<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Vote HMAC Key
    |--------------------------------------------------------------------------
    |
    | Clé secrète utilisée pour calculer le hash_session anonymisant l'électeur
    | dans la table votes. Elle est INDÉPENDANTE de APP_KEY : si APP_KEY est
    | régénérée (rotation, incident), les hash de votes existants restent valides.
    |
    | En production, définir VOTE_HASH_KEY dans le dashboard Render.
    | En local, la définir dans .env (ne jamais committer la valeur réelle).
    |
    */
    'hash_key' => env('VOTE_HASH_KEY'),

];
