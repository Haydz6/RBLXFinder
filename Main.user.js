// ==UserScript==
// @name         RBLXFinder
// @version      1.0
// @description  Finds a player in a roblox server
// @author       Haydz6
// @match        https://www.roblox.com/games/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=roblox.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function RequestFunc(URL, Method, Headers, Body){
    return await (await fetch(URL, {method: Method, headers: Headers, body: Body})).json()
}

async function GetServers(PlaceId, Cursor){
    const Result = await RequestFunc(`https://games.roblox.com/v1/games/${PlaceId}/servers/Public?limit=100&cursor=${Cursor}`, "GET")
}

async function GetImageUrlFromUserId(UserId){
    const Result = await RequestFunc(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${UserId}&size=150x150&format=Png&isCircular=true`, "GET")?.data

    return Result[0].imageUrl
}

async function GetImageUrlsFromTokens(Tokens){
    const Batch = []

    for (let i = 0; i < Tokens.length; i++){
        const Token = Tokens[i]

        Batch.push({
            requestId: Token,
            token: Token,
            type: "AvatarHeadShot",
            size: "150x150",
            format: "PNG",
            isCircular: true
        })
    }

    const Result = await RequestFunc("https://thumbnails.roblox.com/v1/batch", "POST", {["Content-Type"]: "application/json"}, JSON.stringify(Batch))?.data

    const Data = []

    for (let i = 0; i < Result.length; i++){
        const Item = Result[i]

        if (Item.state != "Completed") continue

        Data.push(Item.imageUrl)
    }

    return Data
}

function ImageUrlsHasTargetUrl(TargetUrl, ImageUrls){
    for (let i = 0; i < ImageUrls.length; i++){
        if (ImageUrls[i] == TargetUrl) {
            return true
        }
    }

    return false
}

async function SearchForPlayer(PlaceId, UserId){
    const TargetImageUrl = await GetImageUrlFromUserId(UserId)
    let LastCursor = ""

    while (true) {
        const Servers = await GetServers(PlaceId, LastCursor)
        LastCursor = Servers.nextPageCursor

        for (let i = 0; i < Servers.data.length; i++){
            const Server = Servers.data[i]

            const ImageUrls = await GetImageUrlsFromTokens(Server.playerTokens)

            if (ImageUrlsHasTargetUrl(TargetImageUrl, ImageUrls)) {
                return Server
            }
        }

        if (Servers.data.length == 0) {
            break
        }
    }
}

const ServerFound = await SearchForPlayer(8416011646, 5187703)

if (ServerFound) {
    console.log(ServerFound.id)
} else {
    console.log("didnt find")
}