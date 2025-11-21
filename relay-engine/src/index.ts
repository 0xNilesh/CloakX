import 'dotenv/config';
import { setupListeners } from './listeners';

(async () => {
  console.log('🚀 CloakX Relay Engine Started');
  await setupListeners();
})();
