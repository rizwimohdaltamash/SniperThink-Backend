import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const testUpload = async () => {
  try {
    fs.writeFileSync("dummy.txt", "Hello World");
    const formData = new FormData();
    formData.append("file", fs.createReadStream("dummy.txt"));

    console.log("Sending request to http://localhost:5000/api/upload...");
    const response = await axios.post("http://localhost:5000/api/upload", formData, {
      headers: formData.getHeaders(),
    });
    console.log("Success:", response.data);
  } catch (err) {
    console.log("Status:", err.response?.status);
    console.log("Response Data:", err.response?.data);
    console.log("Error Message:", err.message);
  } finally {
    if (fs.existsSync("dummy.txt")) fs.unlinkSync("dummy.txt");
  }
};

testUpload();
