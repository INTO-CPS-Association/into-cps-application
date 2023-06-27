export interface IGithubApiDir {
    name: string,
    path: string,
    sha: string,
    size: number,
    url: string,
    html_url: string,
    git_url: string,
    download_url: string,
    type: string,
    _links: {
        self: string,
        git: string,
        html: string
    }
}

export interface IDownloadFile {
    version?: string,
    tools?: {
        coe?: {
            name?: string,
            description?: string,
            version?: string,
            releasepage?: string,
            platforms?: {
                any?: {
                    url?: string,
                    filename?: string,
                    md5sum?: string,
                    action?: string,
                }
            }
        },
        maestro2?: {
            name?: string,
            description?: string,
            version?: string,
            releasepage?: string,
            platforms?: {
                any?: {
                    url?: string,
                    filename?: string,
                    md5sum?: string,
                    action?: string,
                }
            }
        }
    }
}