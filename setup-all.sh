#!/bin/bash

# Root Setup Script for both Backend and Frontend
set -e

echo "🌟 Starting Full Project Setup..."

# Setup Backend
echo "--- Backend (backend) ---"
cd backend
./setup.sh
cd ..

# Centralized Reverb Key Generation
if [ -f "backend/.env" ]; then
    echo "🔑 Configuring Reverb keys..."
    
    get_env_val() {
        grep "^$1=" backend/.env | cut -d '=' -f2-
    }

    APP_ID=$(get_env_val "REVERB_APP_ID")
    APP_KEY=$(get_env_val "REVERB_APP_KEY")

    if [ -z "$APP_ID" ] || [ -z "$APP_KEY" ]; then
        echo "📡 Generating new Reverb keys for backend/.env..."
        
        NEW_APP_ID=$(php -r "echo rand(100000, 999999);")
        NEW_APP_KEY=$(php -r "echo substr(str_replace(['/', '+', '='], '', base64_encode(random_bytes(16))), 0, 20);")
        NEW_APP_SECRET=$(php -r "echo str_replace(['/', '+', '='], '', base64_encode(random_bytes(32)));")
        
        update_env() {
            key=$1
            val=$2
            if grep -q "^$key=" backend/.env; then
                sed -i "s|^$key=.*|$key=$val|" backend/.env
            else
                echo "$key=$val" >> backend/.env
            fi
        }

        update_env "REVERB_APP_ID" "$NEW_APP_ID"
        update_env "REVERB_APP_KEY" "$NEW_APP_KEY"
        update_env "REVERB_APP_SECRET" "$NEW_APP_SECRET"
        update_env "VITE_REVERB_APP_KEY" "\"\${REVERB_APP_KEY}\""
    fi

    # Sync to Frontend folder
    echo "🔄 Syncing Reverb keys to frontend/.env..."
    FE_KEY=$(grep "^REVERB_APP_KEY=" backend/.env | cut -d '=' -f2-)
    
    if [ -f "frontend/.env" ]; then
        if grep -q "VITE_REVERB_APP_KEY=" frontend/.env; then
            sed -i "s|^VITE_REVERB_APP_KEY=.*|VITE_REVERB_APP_KEY=$FE_KEY|" frontend/.env
        else
            echo "VITE_REVERB_APP_KEY=$FE_KEY" >> frontend/.env
        fi
        # Sync other reverb vars to frontend
        sed -i "s|^VITE_REVERB_HOST=.*|VITE_REVERB_HOST=\"localhost\"|" frontend/.env
        sed -i "s|^VITE_REVERB_PORT=.*|VITE_REVERB_PORT=8080|" frontend/.env
        sed -i "s|^VITE_REVERB_SCHEME=.*|VITE_REVERB_SCHEME=http|" frontend/.env
    fi

    # Sync to Deskta folder
    echo "🔄 Syncing Reverb keys to deskta/.env..."
    if [ -f "deskta/.env" ]; then
        if grep -q "VITE_REVERB_APP_KEY=" deskta/.env; then
            sed -i "s|^VITE_REVERB_APP_KEY=.*|VITE_REVERB_APP_KEY=$FE_KEY|" deskta/.env
        else
            echo "VITE_REVERB_APP_KEY=$FE_KEY" >> deskta/.env
        fi
        sed -i "s|^VITE_REVERB_HOST=.*|VITE_REVERB_HOST=\"localhost\"|" deskta/.env
        sed -i "s|^VITE_REVERB_PORT=.*|VITE_REVERB_PORT=8080|" deskta/.env
        sed -i "s|^VITE_REVERB_SCHEME=.*|VITE_REVERB_SCHEME=http|" deskta/.env
    fi
fi

# Setup Frontend
# echo "--- Frontend (frontend) ---"
# cd frontend
# ./setup.sh
# cd ..

# # Setup Deskta
# echo "--- Desktop (deskta) ---"
# cd deskta
# ./setup.sh
# cd ..

# # Setup Whatekster
# echo "--- Whatekster (WhatsApp Gateway) ---"
# cd whatekster
# ./setup.sh
# cd ..

# echo "✨ All systems set up successfully!"
