/**
 * A deliberately quiet fallback atmosphere. The fixed WebGL data core is the
 * signature; these two non-interactive layers only preserve depth and texture.
 */
const Background = () => (
    <>
        <div className="fx-spotlight" aria-hidden="true" />
        <div className="fx-grain" aria-hidden="true" />
    </>
)

export default Background
