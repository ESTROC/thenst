import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadProfileImage(file: File, userId: string): Promise<string> {
    try {
        // 5MB limit check (client-side backup)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("File size must be less than 5MB");
        }

        // strict folder structure
        const storageRef = ref(storage, `profile_images/${userId}/${Date.now()}_${file.name}`);

        // Create a timeout promise (30 seconds)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Upload timed out. Check your internet connection or try a smaller file.")), 30000);
        });

        const snapshot = await Promise.race([
            uploadBytes(storageRef, file),
            timeoutPromise
        ]) as any; // Type casting for race result

        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error: any) {
        console.error("Error uploading image:", error);
        if (error.code === 'storage/unauthorized') {
            throw new Error("Permission denied. Please check Firebase Storage rules.");
        }
        throw error;
    }
}

export async function uploadResume(file: File, userId: string): Promise<string> {
    try {
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("File size must be less than 5MB");
        }
        const storageRef = ref(storage, `resumes/${userId}/${Date.now()}_${file.name}`);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Upload timed out. Check your internet connection or try a smaller file.")), 30000);
        });
        const snapshot = await Promise.race([
            uploadBytes(storageRef, file),
            timeoutPromise
        ]) as any;
        return await getDownloadURL(snapshot.ref);
    } catch (error: any) {
        console.error("Error uploading resume:", error);
        throw error;
    }
}

export async function uploadKYCDocument(file: File, userId: string, type: "id_proof" | "incorporation" | "logo"): Promise<string> {
    try {
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("File size must be less than 5MB");
        }
        let folder = "hr_id_proofs";
        if (type === "incorporation") folder = "incorporation_certs";
        if (type === "logo") folder = "company_logos";

        const storageRef = ref(storage, `${folder}/${userId}/${Date.now()}_${file.name}`);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Upload timed out. Check your internet connection or try a smaller file.")), 30000);
        });
        const snapshot = await Promise.race([
            uploadBytes(storageRef, file),
            timeoutPromise
        ]) as any;
        return await getDownloadURL(snapshot.ref);
    } catch (error: any) {
        console.error(`Error uploading KYC document (${type}):`, error);
        throw error;
    }
}
