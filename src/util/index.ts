
export async function sleep(timeout: number): Promise<void> {
    return new Promise(c => setTimeout(c, timeout))
}