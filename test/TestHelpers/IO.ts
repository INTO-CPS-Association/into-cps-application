import axios from "axios";
import { createWriteStream } from "fs";

export async function downloadFile(fileUrl: string, outputPath: string) {
    const writer = createWriteStream(outputPath);

    return axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream'
    }).then( response => {
        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error : any = null;
            writer.on('error', err => {
                error = err;
                writer.close();
                reject(err);
            })
            writer.on('close', () => {
                if(!error) {
                    resolve(true);
                }
            });
        });
    });
}