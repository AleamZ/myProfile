/**
 * Atmosphere behind the WebGL core. None of it is decoration for its own sake:
 * the spotlight biases where the eye lands, the scrim keeps the reading column
 * legible over whatever the scene is doing, and the vignette closes the frame
 * so the canvas reads as something seen through glass rather than pasted on.
 */
const Background = () => (
    <>
        <div className="fx-spotlight" aria-hidden="true" />
        <div className="fx-scrim" aria-hidden="true" />
        <div className="fx-vignette" aria-hidden="true" />
        <div className="fx-grain" aria-hidden="true" />
    </>
)

export default Background
