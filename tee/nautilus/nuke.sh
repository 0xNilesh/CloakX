sudo nitro-cli terminate-enclave --all || true
sudo rm -rf /var/lib/nitro_enclaves/*
docker system prune -af --volumes
docker builder prune -af
rm -rf out
sudo reboot

~         
