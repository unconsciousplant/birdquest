// Lets the user choose a photo and shows a preview of it.
// The photo stays in the browser; nothing is uploaded.
//
// Props:
//   previewUrl      address of the photo to preview, or null if none chosen
//   disabled        true while matches are being found
//   onSelectFile    called with the chosen File
//   onPreviewError  called if the browser can't display the image
export default function PhotoPicker({ previewUrl, disabled, onSelectFile, onPreviewError }) {
  function handleChange(event) {
    const file = event.target.files[0]
    // Reset the input so choosing the same file again still counts as a change.
    event.target.value = ''
    if (file) {
      onSelectFile(file)
    }
  }

  const buttonStyle = previewUrl ? 'button-secondary' : 'button-primary'

  return (
    <div className="photo-picker">
      {previewUrl && (
        <img
          className="photo-preview"
          src={previewUrl}
          alt="Your chosen bird photo"
          onError={onPreviewError}
        />
      )}

      {/* The real file input is hidden; the label is styled as a button. */}
      <label className={`button ${buttonStyle} file-button${disabled ? ' is-disabled' : ''}`}>
        <input
          type="file"
          accept="image/*"
          className="visually-hidden"
          disabled={disabled}
          onChange={handleChange}
        />
        {previewUrl ? 'Choose a different photo' : 'Choose a photo'}
      </label>
    </div>
  )
}
