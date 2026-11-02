
export type SignalResult = {
    exitState: string;
    passed: boolean;
    message: string;
};


export function checkCircuit(circuitConfig: boolean[], expectedConfig: boolean[]): SignalResult {
    const failure: SignalResult = {
        exitState: "locked",
        passed: false,
        message: "Incorrect Circuit! Level Failed!",
    };

    if (circuitConfig.length === 0 || circuitConfig.length !== expectedConfig.length) {
        return failure;
    }

    for (let i = 0; i < expectedConfig.length; i++) {
        if (circuitConfig[i] !== expectedConfig[i]) {
            return failure;
        }
    }

    return {
        exitState: "open",
        passed: true,
        message: "Correct Circuit! Level Complete!",
    };
}



