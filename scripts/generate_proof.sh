#!/bin/bash
# Generate proof using Noir

cd ../circuit

echo "Checking circuit..."
# nargo check  --overwrite

# echo "Compiling circuit..."
# nargo compile

creating the key
bb write_vk -b ./target/pm.json -o ./target/vk

# echo "Compiling circuit..."
# nargo execute

echo "Generating proof..."
# nargo prove
bb prove -b ./target/pm.json -w ./target/pm.gz -o ./target/proof

echo "verifying proof..."
bb verify -b ./target/pm.json -w ./target/pm.gz -i ./target/proof

echo "verifying proof with key..."
bb verify -k ./target/vk -p ./target/proof
