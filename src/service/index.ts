import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

export abstract class AbstractGoogleSpreadsheetService {

    doc: Promise<GoogleSpreadsheet>

    constructor(sheetId: string, authEmail: string, authKey: string) {
        this.doc = this.connect(sheetId, authEmail, authKey)
    }

    private async connect(sheetId: string, authEmail: string, authKey: string): Promise<GoogleSpreadsheet> {
        const jwt = new JWT({
            email: authEmail,
            key: authKey,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.file',
            ]
        })
        const s = new GoogleSpreadsheet(sheetId, jwt)
        await s.loadInfo()
        return s
    }
}