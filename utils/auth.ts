const ALLOWED_HASHES = [
    "5cbe90c737f679fb013454dddd48c33944ceb15a739beafc88d5f9d10eb99c81", // 8lTqZiPtCXF0
    "e149e1ece812de2ca8019fa810b6dddce748bf181634160de4d070714c7ccfad", // Gztf5waFGM3B
    "d9abb6fd83af9b89d625d9ffeaf6a2eeab7235f1e7658b8b8359ded22953774e", // Tynl4lVfmVcy
    "d02a8845b7e86d624b0b5d7b04e920a923d048dbcc6cfff27ed85c0f94024e68", // OTKpBVwt5kgQ
    "f116eec1948738244dd92d8ec3978e9ae216cdfed42a169e0ab00b0c8d48067f", // P3IteVVqhbue
    "2ac59019757407220760de693f6c0ee93fa183af69c6f6f6962e203cf38c9d70", // aKle5VI7XVVD
    "23864d33bed8a9be3e0eef6e49f0b5cf67cecb63a9b6594e8d59dacb05bc73be", // gEhn7uj1OUsk
    "49c4e05220d0515f8b1a8235efe69abfe19d3c63746767945a4207878484caa5", // f7jDOQ3FcHOH
    "421ce43b449181d331037cbc9e2e260f7b31cedc8a066b07d7d42273ef034173", // scpgtgHPrAP8
    "71d889833facc7d2233a085e7eaa6491a8600f8ee28ece5b1e51b7370a9d0dcf", // 70ZGCQJQUZ0s
    "73fb8a558637bfb5b727291f7a242922d5af037abbdfddffccc4ecc59772eaec", // jhZdTIjlgwgm
    "e38b86f45bff094aedb5ff4111fd8f601a92187560aedcc740830ff9c8ab0495", // Hl6oB1bhF9b5
    "a5ffa0caad8f3a28e8fc13a76e4d60d065df6270704f46107f0f87699efc3c2c", // dvvQJn4WUSoz
    "8a3b65c207291a3a561be16eacbc1914cc613e25c7940e5df4db826626425d99", // X0GbyeuF1XVC
    "42614d170f14ac4292eed477cbe1a0db09a75f97de7b413373be5014b9440dd3", // sAdJFuzNMfxC
    "b01d451b7333dfeda8168b5bdef29b48e5d848fc363df8f40e2e6f9143678ab2", // 2BkzWCJ8Q6TR
    "64eb69669ef3409dfc2e71a6a886e09707e381c595b8f0deb65c7c871bcdff0c", // jOudYCko1tGc
    "bb9c10ece6e594b373a4e3d17aea5b07bd40139a67f98591d02ae6b25f5fc270", // 0wDs0H6g3nWx
    "2569250f366aa1d2543aab0a776ce0e80b8a7d2d4ddda14d10487f2f293c5566", // OrFaU6dlHtmL
    "ea41789a39fec758f9d68452ed6f4a88f9f0c9341881ee58be9b0392dbc76c62", // AOgUb5FXMiEX
    "3e7d82b732378a7a91daf7684e28d7434b66961ae78951950be679346f7d8f56", // 1qvH6OsO8xAC
    "40b30ee0304a418db7051f10ac84cdae1ea68a851613d9ce9f8da2454b9027d8", // 8x1k9fziVREB
    "8c06363177e0be81ac38378d013fc02d91e5fc7ebd1a5dd906db34341615fd84", // TbkIVVk4ehzc
];

export async function hashPassword(password: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string): Promise<boolean> {
    const hash = await hashPassword(password);
    return ALLOWED_HASHES.includes(hash);
}

export function isAuthenticated(): boolean {
    return localStorage.getItem('auth_token') === 'valid';
}

export function setAuthenticated() {
    localStorage.setItem('auth_token', 'valid');
}

export function logout() {
    localStorage.removeItem('auth_token');
}
