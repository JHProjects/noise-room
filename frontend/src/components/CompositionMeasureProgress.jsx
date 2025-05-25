import { useSequencerCtx } from '../context/SequencerContext.js'

function CompositionMeasureProgress() {
    const { composition } = useSequencerCtx()

    return (
        <div 
            className='token-amount-to-add-measure'
        >   
            {/* <p className='token-amount-ttile'>Next measure: </p> */}
            <div className='token-amount-data'>
                {composition.tokensSpent?.toLocaleString('cs-CZ')} / <span className='token-data-target'>{composition.amountForNextMeasure?.toLocaleString('cs-CZ')} <i className="icon note"/></span>
            </div>
            <p className='token-amount-description'>For next measure unlock</p>
        </div>
    )
}

export default CompositionMeasureProgress