const BOX = 151916
module.exports = function openVmwaBox(dispatch){

    const ploc = new (require('./lib/playerLocation.js'))(dispatch)
    const item = new (require('./lib/cat_utils/useItem.js'))(dispatch, ploc)
    const inv = new (require('./lib/cat_utils/inventory.js'))(dispatch)
    const msg = new (require('./lib/cat_utils/message.js'))(dispatch, 'openBox', '#3f7ebd')
    const chat = new (require('./lib/cat_utils/chatCommands.js'))(dispatch)
    chat.add('open', open)

    var count = 0;

    function open(){
        count = inv.getAmount(BOX)
        openBox()
    }
    function openBox(){
        if (count > 0){
            useBox()
            .then(tryGacha)
            .then(() => {openBox()})
            .catch(e => msg.error(e.message))
        } else {
            msg.message('You\'re out of boxes')
        }
    }
    function useBox() {
        return new Promise((resolve, reject) => {
            const gachaStartHook = dispatch.hookOnce('S_GACHA_START', 1, event => {
                resolve(event.id)
                return false
            })
            const gachaCancelHook = dispatch.hookOnce('C_GACHA_CANCEL', 1, event => {
                if (gachaStartHook) dispatch.unhook(gachaStartHook)
                dispatch.unhook(gachaCancelHook)
                reject(new Error('canceled'))
            })
            setTimeout(() => {
                if (gachaStartHook) dispatch.unhook(gachaStartHook)
                reject(new Error('request timed out'))
            }, 5000)
            item.use(BOX)
        })
    }
    function tryGacha(id){
        return new Promise((resolve, reject) => {
            const gachaEndHook = dispatch.hookOnce('S_GACHA_END', 1, event => {
                count--
                resolve()
                return false
            })
            const gachaCancelHook = dispatch.hookOnce('C_GACHA_CANCEL', 1, event => {
                if (gachaEndHook) dispatch.unhook(gachaEndHook)
                dispatch.unhook(gachaCancelHook)
                reject(new Error('canceled'))
            })
            setTimeout(() => {
                if (gachaEndHook) dispatch.unhook(gachaEndHook)
                reject(new Error('request timed out'))
            }, 5000)
            dispatch.toServer('C_GACHA_TRY', 1, {id: id})
        })
    }
}
