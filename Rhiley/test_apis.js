
const apis = [
    "https://image.pollinations.ai/prompt/cyberpunk%20cat",
    "https://hercai.onrender.com/v3/text2image?prompt=cat",
    "https://hercai.herokuapp.com/v3/text2image?prompt=cat",
    "https://api.airforce/v1/image?prompt=cat",
    "https://shiki-api.vercel.app/api/image?prompt=cat",
    "https://raiden-api.vercel.app/api/image?prompt=cat",
    "https://flux-api.vercel.app/api/image?prompt=cat"
];

async function test() {
    for (const url of apis) {
        try {
            console.log(`Testing ${url}...`);
            const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10000) });
            console.log(`Status: ${res.status}`);
            if (res.ok) {
                const contentType = res.headers.get('content-type');
                console.log(`Content-Type: ${contentType}`);
                if (contentType && contentType.includes('image')) {
                    console.log(`✅ SUCCESS: ${url}`);
                    return;
                }
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }
}

test();
