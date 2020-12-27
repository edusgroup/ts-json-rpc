type TID = number

interface IJsonRpcError {
    code: number
    message: string
}

interface TUserApiSettings {
    request: object | any[]
    response: any
    error?: any
}

interface IUserApi {
    [key: string]: TUserApiSettings
}

export interface IRequestData {
    jsonrpc: '2.0';
    id: number;
    method: any;
    params?: any
}

interface IResponseSuccessNative {
    jsonrpc: '2.0',
    id: number,
    method?: string,
    params: any
}

interface IResponseErrorNative {
    jsonrpc: '2.0',
    error: IJsonRpcError,
    id: number | null
}

function isErrorResponse<TResult>(result: any): result is TResult {
    return 'error' in result
}

interface IHttpClientNative {
    call: (data: IRequestData[]) => Promise<(IResponseSuccessNative | IResponseErrorNative)[]>
}

type TUserApiError<TApi extends IUserApi, TMethod extends keyof TApi> =
    undefined extends TApi[TMethod]['error'] ? IJsonRpcError : TApi[TMethod]['error']

type TUserApiResponse<TApi extends IUserApi, TMethod extends keyof TApi> =
    TApi[TMethod]['response']

type TErrorResponse<TApi extends IUserApi, TMethod extends keyof TApi> = {
    error: TUserApiError<TApi, TMethod>,
    id: TID | null
}

type TSuccessResponse<TApi extends IUserApi, TMethod extends keyof TApi> = {
    id: TID,
    method?: TMethod,
    result: TUserApiResponse<TApi, TMethod>
}

type TResponse<TApi extends IUserApi, TMethod extends keyof TApi> =
    TSuccessResponse<TApi, TMethod>
    | TErrorResponse<TApi, TMethod>

export class JsonRpcClient<TApi extends IUserApi> {
    private readonly httpClient: IHttpClientNative;

    constructor(httpClient: IHttpClientNative) {
        this.httpClient = httpClient
    }

    public async call<TMethod extends keyof TApi>(
        id: TID,
        method: TMethod,
        params?: TApi[TMethod]['request']
    ): Promise<TResponse<TApi, TMethod>> {
        const data: IRequestData = {
            jsonrpc: '2.0',
            id: id,
            method: method,
        };

        if (params !== undefined) {
            data.params = params
        }

        const response = await this.httpClient.call(data)
        if (isErrorResponse<IResponseErrorNative>(response)) {
            return {
                error: response.error,
                id: response.id,
            } as TErrorResponse<TApi, TMethod>
        }

        const result: TSuccessResponse<TApi, TMethod> = {
            id: response.id,
            result: response.params,
        };

        if (response.method !== undefined) {
            result.method = response.method as TMethod
        }

        return result
    }

    public async callBatch<TMethod extends keyof TApi>(
        dataArray: IBatchData<TApi, TMethod>[]
    ): Promise<(IResponseSuccessNative | IResponseErrorNative)[]> {
        const requestData: IRequestData[] = dataArray.map(requestData => {
            const data: IRequestData = {
                jsonrpc: '2.0',
                id: requestData.id,
                method: requestData.method,
            };

            if (requestData.params !== undefined) {
                data.params = requestData.params
            }
            return data
        });

        return await this.httpClient.call(requestData)
    }

    public isErrorResponse<TMethod extends keyof TApi>(response: TResponse<TApi, TMethod>): response is TErrorResponse<TApi, TMethod> {
        return isErrorResponse(response)
    }
}

interface IBatchData<TApi extends IUserApi, TMethod extends keyof TApi> {
    id: TID
    method: TMethod
    params?: TApi[TMethod]['request']
}


// function isError<T extends IUserApi, K extends keyof T>(result: TResponse<T, K>): result is TErrorResponse<T, K> {
//     return 'error' in result
// }


const httpClient = {
    call: async (obj: IRequestData) => {
        console.log(obj)

        return {
            id: 1,
            jsonrpc: '2.0',
            method: 'dassdfsdf',
            params: {
                test: 1
            }
        } as IResponseSuccessNative
    }
};

interface IAppApi extends IUserApi {
}

interface IAppApi {
    remove: {
        request: { d: number }
        response: { y: number }
        error: { code: number, msg: string }
    }
}


interface IAppApi {
    removeData: {
        request: { x: number }[]
        response: { id: number, params: [] }
        // error: IJsonRpcError & { data: number }
    }

    kill: {
        request: { y: number }
        response: { y: number }
    }
}

const client = new JsonRpcClient<IAppApi>(httpClient);

(async () => {
    const result = await client.call(1, 'removeData', {x: 1});
    if (client.isErrorResponse(result)) {
        console.log(result)
    } else {
        console.log(result)
    }
})();
