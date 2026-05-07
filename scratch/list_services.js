import { adminService } from './lib/services/adminService';

async function listServices() {
    try {
        const services = await adminService.getMasterServices();
        console.log("ALL SERVICES:");
        console.log(JSON.stringify(services, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
}

listServices();
