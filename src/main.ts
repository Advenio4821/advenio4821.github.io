import CryptoJS from "crypto-js";
import JSZip, { prototype } from "jszip";

import * as b64 from "base64-arraybuffer";
import * as fileSaver from "file-saver";

const KEY_BYTES = new Uint8Array([0x70, 0xf0, 0xb2, 0x0c, 0x62, 0x28, 0x88, 0x46]);
const KEY = CryptoJS.lib.WordArray.create(KEY_BYTES as any);

function decryptImage(base64EncodedImage: string) {
    let decrypted = CryptoJS.DES.decrypt(base64EncodedImage, KEY, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
    });    
    
    return decrypted.toString(CryptoJS.enc.Base64);
}

function readFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

async function processFile(file: File, zipFile: JSZip) {
    let encryptedData = b64.encode(await readFile(file));
    let decryptedData = decryptImage(encryptedData);

    zipFile.file(
        file.name.replace(".enc", ".jpg"), 
        decryptedData, 
        { base64: true }
    );
}

async function processFiles(files: FileList, progressCallback: (done: number, total: number) => void) {
    let zipFile = new JSZip();
    let done = 0;
    let numFiles = files.length;
    for (let file of files) {
        await processFile(file, zipFile);
        progressCallback(++done, numFiles);
    }

    fileSaver.saveAs(
        await zipFile.generateAsync({ type: "blob" }), 
        "decrypted.zip"
    );
}

async function decrypt() {
    let files = document.getElementById("filesInput") as HTMLInputElement;
    if (files.files && files.files.length > 0) {
        await processFiles(files.files, (done, total)=> {
            let progressElement = document.getElementById("progressBar")! as HTMLDivElement;
            let progressPercent = (done / total) * 100;
            console.log(progressPercent);
            progressElement.style.width = progressPercent + "%";
            progressElement.innerText = progressPercent.toFixed(0) + "%";
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("decryptButton")!
        .addEventListener("click", decrypt);
});