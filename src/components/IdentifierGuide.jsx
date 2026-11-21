// Plain-language notes about the photo identifier: what it knows,
// how to get good results, how to read it, privacy and credit.
export default function IdentifierGuide() {
  return (
    <section className="card prediction-guide" aria-labelledby="identifier-guide-heading">
      <h2 id="identifier-guide-heading" className="card-title">
        About the identifier
      </h2>
      <dl className="guide-list">
        <div>
          <dt>What it knows</dt>
          <dd>
            373 bird species that are common in China, including all 60 species in our trip planner.
            If your bird isn&apos;t one of them, every match will be wrong.
          </dd>
        </div>
        <div>
          <dt>For the best results</dt>
          <dd>
            Use a clear photo of one bird. The identifier only looks at the middle square of the
            photo, so crop it with the bird in the centre.
          </dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>
            How strongly the model favours a species over the others it knows. It isn&apos;t a
            measure of accuracy, and a confident match can still be wrong.
          </dd>
        </div>
        <div>
          <dt>How accurate is it?</dt>
          <dd>
            Its authors report that, on their own test photos from iNaturalist, the right species came
            first about 62% of the time and was in the top three about 75% of the time. It hasn&apos;t
            been tested on Hong Kong photos.
          </dd>
        </div>
        <div>
          <dt>Privacy</dt>
          <dd>
            The identifier runs on your device, and your photo isn&apos;t uploaded anywhere. The
            first time, it downloads about 60 MB; after that your browser keeps it.
          </dd>
        </div>
        <div>
          <dt>Credit</dt>
          <dd>
            <a href="https://github.com/Firefly-ZJ/Bird-Classification">Bird-Classification</a> by
            Zhang Jun (MIT licence), trained on photos from iNaturalist. English names from
            iNaturalist; Chinese names are simplified characters, as in the original species list.
          </dd>
        </div>
      </dl>
    </section>
  )
}
