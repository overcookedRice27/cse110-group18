const SAVE_KEY = "logicGame.save"; //data stored in localStorage
const SAVE_VERSION = 1;
const TOTAL_LEVELS = 5;

export function hasProgress(): boolean {
    try {
        const raw = localStorage.getItem(SAVE_KEY); //retrieves prev game data from local storage
        if (raw === null) return false;

        const data = JSON.parse(raw); //convert string data to javascript obj
        //^^done to access properties like .version or .highestcompleted
        return (
            data.version === SAVE_VERSION && //correct save format version
            Number.isInteger(data.highestCompleted) && //level must be whole num
            data.highestCompleted >= 1 && //must complete atleast one level
            data.highestCompleted <= TOTAL_LEVELS //cannot exceed total num of levels
            //checks if progress is valid
        );
    } catch {
        return false;
    }
}