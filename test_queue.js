import fs from "fs";
import { uploadFile } from "./src/controllers/uploadController.js";

const testQueue = async () => {
    try {
        fs.writeFileSync("dummy.txt", "This is a test document with words like the and a.");
        
        const req = {
            file: {
                originalname: "dummy.txt",
                mimetype: "text/plain",
                size: 50,
                path: "dummy.txt"
            },
            body: {
                name: "Test",
                email: "test@example.com"
            }
        };

        const res = {
            status: (code) => {
                console.log(`Status: ${code}`);
                return res;
            },
            json: (data) => console.log(JSON.stringify(data, null, 2))
        };

        await uploadFile(req, res);
    } catch(e) {
        console.error("Test script error:", e);
    }
}
testQueue();
