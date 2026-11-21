import QAItem from '../components/QAItem.jsx'
import { TEAM } from '../content/team.js'

// Q&A: how BirdQuest's three parts work, why they were built this way,
// their limitations and assumptions, and what we found.
// Figures come from the project's documents (docs/model, docs/classifier,
// docs/assistant). Update them here if those documents change.
export default function QAScreen() {
  const hasMembers = TEAM.members.length > 0

  return (
    <>
      <section className="screen-intro">
        <h1>Questions and answers</h1>
        <p className="lead">
          How BirdQuest’s three parts work, why we built them this way, what they can’t do, and what we
          found along the way.
        </p>
      </section>

      <section className="card team-card" aria-labelledby="team-heading">
        <h2 id="team-heading" className="card-title">
          Built by {TEAM.name}
        </h2>
        <p>
          BirdQuest is a university project prototype built by {TEAM.name}
          {hasMembers ? ':' : '.'}
        </p>
        {hasMembers && (
          <ul className="team-list">
            {TEAM.members.map((member) => (
              <li key={member}>{member}</li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------------- About ---------------- */}
      <section className="qa-section" aria-labelledby="qa-about">
        <h2 id="qa-about" className="section-title">
          About BirdQuest
        </h2>

        <QAItem question="What is BirdQuest?" open>
          <p>BirdQuest (翼探) is a prototype website to help birdwatchers in Hong Kong. It has three parts:</p>
          <ul>
            <li>
              <strong>Plan a trip</strong> predicts which birds you’re likely to record at a place and time,
              or where and when to look for a particular bird.
            </li>
            <li>
              <strong>Identify</strong> suggests which species a bird photo shows.
            </li>
            <li>
              <strong>Assistant</strong> is a chatbot that answers basic questions about 61 Hong Kong species.
            </li>
          </ul>
          <p>Everything it shows is an estimate, so check a field guide before relying on it.</p>
        </QAItem>

        <QAItem question="Why did we build it?">
          <p>
            Hong Kong’s wetlands, woodlands and shrublands support a wide range of birds, but what you see
            depends on the place, season, weather and time of day. Sighting reports are scattered across social
            media and citizen-science platforms, so planning a trip is uncertain. Beginners in particular can miss
            the birds they hoped for and lose interest after an unproductive outing.
          </p>
          <p>
            BirdQuest brings planning, identification and learning together in one place. It’s for beginners,
            for experienced birdwatchers looking for a particular species, and for nature enthusiasts.
          </p>
        </QAItem>

        <QAItem question="Does BirdQuest collect or upload my data?">
          <p>
            No. There are no accounts, and all three parts run inside your browser. Photos are never uploaded,
            your questions aren’t sent anywhere, and nothing is saved: reloading the page, or pressing{' '}
            <strong>Reset demo</strong>, clears everything.
          </p>
          <p>
            The site doesn’t contact any outside service (live weather forecasts are switched off). The only
            downloads are the site’s own files, including the models: about 60 MB for the photo identifier and
            850 KB for the trip model. Your browser may keep these in its normal cache.
          </p>
        </QAItem>

        <QAItem question="Why does everything run in the browser instead of on a server?">
          <ul>
            <li>
              <strong>Privacy:</strong> photos and questions never leave your device.
            </li>
            <li>
              <strong>Simplicity:</strong> no server to host or maintain, and no API keys to protect.
            </li>
            <li>
              <strong>Consistency:</strong> once loaded it works offline, and everyone gets the same answers.
            </li>
          </ul>
          <p>
            The trade-offs: the photo identifier is a large first download, and your device does the
            calculating.
          </p>
        </QAItem>
      </section>

      {/* ---------------- Plan a trip ---------------- */}
      <section className="qa-section" aria-labelledby="qa-plan">
        <h2 id="qa-plan" className="section-title">
          <span className="card-icon" aria-hidden="true">
            🗺️
          </span>
          Plan a trip: the occurrence model
        </h2>

        <QAItem question="What does the trip planner predict?">
          <p>
            The chance that a birdwatcher would record each species on a visit to a given place, at a given
            date, time and weather. A visit here means a complete eBird checklist. It answers two questions:
          </p>
          <ul>
            <li>
              <strong>What can I see?</strong> Choose a place, date and time. You get the most likely of 60
              species, and other hotspots that are better at that time.
            </li>
            <li>
              <strong>Where can I see it?</strong> Choose a bird and up to 7 days. You get the best of 98
              hotspots and 2-hour visit times.
            </li>
          </ul>
        </QAItem>

        <QAItem question="What data was it trained on?">
          <p>
            9,847 complete eBird checklists from Hong Kong, from 1 October 2025 to 30 September 2026, covering
            the 60 most often recorded species at 117 locations. On a complete checklist the observer reports
            every species they identified, so a missing species tells the model something.
          </p>
          <p>Each checklist is described by 149 inputs:</p>
          <ul>
            <li>the date, as a smooth yearly cycle</li>
            <li>the start time, day length, and time since sunrise and until sunset</li>
            <li>the location</li>
            <li>the effort: how long, how far and how many observers</li>
            <li>
              10 daily weather measures from the Hong Kong Observatory: temperature and its change since the
              day before, humidity, rain today and over 3 days, change in air pressure, cloud, sunshine, and
              wind speed and direction
            </li>
          </ul>
        </QAItem>

        <QAItem question="What kind of model is it, and why that one?">
          <p>
            It averages two models: a logistic regression for each species, and a small neural network (two
            hidden layers of 256 and 128 units) that predicts all 60 species at once.
          </p>
          <p>
            We compared several approaches on validation data, using average ROC-AUC. That measures how well
            a model ranks visits where a bird was recorded above visits where it wasn’t; 1 is perfect and 0.5
            is guessing.
          </p>
          <ul>
            <li>
              <strong>Baselines:</strong> 0.603 for a month-only baseline and 0.858 for a location-and-month
              baseline.
            </li>
            <li>
              <strong>Single models:</strong> 0.83 for k-nearest neighbours, 0.894 for logistic regression,
              0.896 for the neural network and 0.898 for LightGBM.
            </li>
            <li>
              <strong>Logistic regression and neural network averaged:</strong> 0.899.
            </li>
          </ul>
          <p>
            Adding LightGBM to the average reached 0.902. LightGBM can’t run in a browser from a simple data
            file, though, so we chose the two-model average. Both of its models were trained in Python with
            scikit-learn and saved as plain numbers that the website can calculate with directly.
          </p>
        </QAItem>

        <QAItem question="How was it tested, and how good is it?">
          <p>The checklists were split by day of the month:</p>
          <ul>
            <li>
              <strong>Training:</strong> days 1–18 (5,921 checklists).
            </li>
            <li>
              <strong>Validation:</strong> days 19–24 (1,869), used to choose the model and each species’
              cut-off.
            </li>
            <li>
              <strong>Testing:</strong> day 25 onwards (2,057), used only once, at the end.
            </li>
          </ul>
          <p>On the test set, averaged over the 60 species:</p>
          <ul>
            <li>
              <strong>F1 score:</strong> 0.718, compared with 0.433 for a baseline that only knows how often
              each bird is reported in each month, and 0.680 for a location-and-month baseline.
            </li>
            <li>
              <strong>ROC-AUC:</strong> 0.898, compared with 0.590 for the month-only baseline.
            </li>
            <li>
              <strong>Every one of the 60 species</strong> beat the month-only baseline, with F1 gains from
              0.015 to 0.602 (0.285 on average).
            </li>
            <li>
              <strong>The chances are well calibrated.</strong> When the model said 80–100%, the bird was
              recorded about 88% of the time; when it said 40–60%, about 53%. So the percentages can be read
              as real chances.
            </li>
          </ul>
          <p>
            The hardest species were the Gray Wagtail (F1 0.43), House Swift (0.44) and Blue Whistling-Thrush
            (0.50). They are less often recorded, or easy to overlook: swifts, for example, are only recorded
            if someone looks up.
          </p>
        </QAItem>

        <QAItem question="What do “chance of recording”, “likely” and “reliability” mean?">
          <ul>
            <li>
              <strong>Chance of recording</strong> is the model’s probability that the species is recorded on
              a visit like yours.
            </li>
            <li>
              <strong>Likely</strong> means the chance is above that species’ cut-off. Each cut-off was chosen
              during validation to balance missed birds against false alarms (by maximising F1).{' '}
              <strong>Possible</strong> means it’s above half of that cut-off.
            </li>
            <li>
              <strong>Reliability</strong> starts high and drops one level for each of these:
              <ul>
                <li>the species was harder to predict in testing (test ROC-AUC below 0.80)</li>
                <li>the weather isn’t a short-range forecast (always true for now)</li>
                <li>the place is more than 3 km from a modelled hotspot</li>
                <li>the place has no training checklists within a month either side of the date</li>
              </ul>
            </li>
          </ul>
          <p>
            “Where can I see it?” sorts by chance, minus a small penalty for less reliable results: 0.05 for
            medium and 0.10 for low.
          </p>
        </QAItem>

        <QAItem question="How does weather work?">
          <p>
            The model uses 10 weather measures. Live forecasts from Open-Meteo, a free weather service, are
            switched off, because using them would make the site contact an outside service. So by default it
            uses typical weather for the month, which lowers reliability by one level.
          </p>
          <p>
            For demonstrations, <strong>Set it myself (demo)</strong> lets you change the weather and see how
            the predictions respond. Those results are a what-if, not a forecast.
          </p>
          <p>
            We measured how much each weather measure matters by changing it from a low to a high value.
            Temperature has the biggest effect (5.5 percentage points on average) and rain the smallest (1.6).
          </p>
        </QAItem>

        <QAItem question="What were the key findings?">
          <ul>
            <li>
              <strong>Place matters as much as season.</strong> The model clearly beats predicting from the
              month alone.
            </li>
            <li>
              <strong>It copes with seasons it hasn’t seen.</strong> In a tougher test, it was trained on
              October to March only and tested on June to September. It still reached ROC-AUC 0.877 (F1
              0.596), while the month-only baselines fell to 0.5, no better than guessing. Weather, day length
              and location carry real information.
            </li>
            <li>
              <strong>Rain is a surprise.</strong> Rainy weather raises the expected number of species: at Mai
              Po in late November, from about 31 to 38. This probably reflects who goes birding in the rain
              (keen birders who record more), not birds being easier to see.
            </li>
            <li>
              <strong>Something to check:</strong> Long Valley ranks joint-top for Pied Avocet, a bird mostly
              seen on the Deep Bay mudflats. It’s worth checking against the raw records.
            </li>
            <li>
              <strong>Privacy:</strong> the original model file included 19 private eBird locations (people’s
              homes and balconies) with exact coordinates. We removed them before publishing; predictions for
              the public hotspots are unchanged.
            </li>
          </ul>
        </QAItem>

        <QAItem question="What are its limitations and assumptions?">
          <ul>
            <li>
              <strong>One year of data</strong>, so it can’t capture differences between years, such as cold
              winters or early migration.
            </li>
            <li>
              <strong>It predicts recording, not presence.</strong> A bird can be there and still be missed, and
              “not recorded” doesn’t mean “absent”.
            </li>
            <li>
              <strong>Observer behaviour shapes the data:</strong> popular sites, fine weather and weekends
              produce more checklists.
            </li>
            <li>
              <strong>Coverage:</strong> only 60 common species and 98 public hotspots. Rarer birds, including
              the Black-faced Spoonbill, aren’t modelled.
            </li>
            <li>
              <strong>No tide data</strong>, which matters a lot for waterbirds at Mai Po and Deep Bay.
            </li>
            <li>
              <strong>One weather station for all of Hong Kong:</strong> the weather comes from a single
              Hong Kong Observatory station, and by default it’s the typical weather for the month.
            </li>
            <li>
              <strong>A standard visit is assumed:</strong> a walking checklist covering 1 km, with one observer.
            </li>
            <li>
              <strong>The test results may be a little flattering.</strong> Splitting by day of the month means
              the test days share each month’s season and weather with the training days. The time-based test
              above (F1 0.596) is a tougher check.
            </li>
          </ul>
        </QAItem>
      </section>

      {/* ---------------- Identify ---------------- */}
      <section className="qa-section" aria-labelledby="qa-identify">
        <h2 id="qa-identify" className="section-title">
          <span className="card-icon" aria-hidden="true">
            📷
          </span>
          Identify: the photo identifier
        </h2>

        <QAItem question="How does the photo identifier work?">
          <p>
            It uses <strong>Bird-Classification</strong> by Zhang Jun, an open-source image classifier (MIT
            licence). It’s a ConvNeXt-style convolutional neural network (the “v1 base” model, about 12 million
            parameters), trained on about 220,000 iNaturalist photos of 373 bird species common in China. Those
            include all 60 trip-planner species and the Black-faced Spoonbill.
          </p>
          <p>
            We converted it from PyTorch to the ONNX format, so it runs in the browser with onnxruntime-web
            (WebAssembly). For each photo it:
          </p>
          <ol>
            <li>shrinks the photo so its shorter side is 256 pixels</li>
            <li>keeps the middle 224 × 224 square</li>
            <li>adjusts the colours the same way as in training</li>
            <li>runs the model, which turns its scores into confidences that add up to 100%</li>
            <li>shows the top 3</li>
          </ol>
        </QAItem>

        <QAItem question="Why this model?">
          <ul>
            <li>It covers every species our trip planner and assistant support, and many more.</li>
            <li>
              It was trained on far more photos than we could have gathered ourselves for a Teachable Machine
              model, which was our original plan.
            </li>
            <li>It runs entirely on your device, so photos stay private.</li>
            <li>Its MIT licence allows reuse with credit.</li>
          </ul>
          <p>
            The identifier is a replaceable part of the site, so a model we train ourselves could be swapped
            in later.
          </p>
        </QAItem>

        <QAItem question="How did you check that it works the same in the browser?">
          <ul>
            <li>
              <strong>The converted model matches the original PyTorch model:</strong> raw scores differ by at
              most 0.0002, with the same top 3.
            </li>
            <li>
              <strong>The website matches the original to within 0.006 percentage points</strong> on the
              project’s sample photos, after one fix. Browsers shrink photos slightly differently from the
              Python library used in training (Pillow). That shifted confidences by up to 7.6 points and
              changed one third-place match. So we wrote a resizer that copies Pillow exactly: it gave
              identical pixels in all 13 test cases.
            </li>
            <li>
              <strong>The species order is right.</strong> On the author’s example photo, the site gives Spotted
              Dove at 91.4%; the author’s own app gives 91.7%, with the same second and third suggestions.
            </li>
          </ul>
        </QAItem>

        <QAItem question="How accurate is it?">
          <p>
            Its authors report that, on their own iNaturalist test photos, the right species came first 62% of
            the time and was in the top three 75% of the time. We haven’t measured its accuracy on Hong Kong
            photos, so we don’t claim a figure of our own.
          </p>
          <p>
            One honest example: for a sample photo of a Eurasian Eagle-Owl, its first choice was Long-eared Owl
            (52%), with the correct species second (8%).
          </p>
        </QAItem>

        <QAItem question="What are its limitations and assumptions?">
          <ul>
            <li>It only knows 373 species. Any other bird still gets three matches, and all of them are wrong.</li>
            <li>It only looks at the middle square of the photo, so a bird near the edge may be cut off.</li>
            <li>Confidence is the model’s own score. It isn’t calibrated and isn’t a measure of accuracy.</li>
            <li>
              It was trained mainly on photos from mainland China and other parts of Asia, so we assume Hong Kong
              photos are similar.
            </li>
            <li>The first time you use it, it downloads about 60 MB.</li>
            <li>
              Chinese names are simplified characters, as in the original list (we repaired 8 that had been
              damaged). English names come from iNaturalist.
            </li>
            <li>
              The training photos are under various Creative Commons licences, some non-commercial. That’s fine
              for a university project, but would need checking for commercial use.
            </li>
          </ul>
        </QAItem>
      </section>

      {/* ---------------- Assistant ---------------- */}
      <section className="qa-section" aria-labelledby="qa-assistant">
        <h2 id="qa-assistant" className="section-title">
          <span className="card-icon" aria-hidden="true">
            💬
          </span>
          Assistant: the rule-based chatbot
        </h2>

        <QAItem question="How does the assistant work?">
          <p>It’s a rule-based chatbot with no AI. For each question it:</p>
          <ol>
            <li>
              tidies the text: lower case, no punctuation, “grey” treated as “gray”, and traditional Chinese
              converted to simplified
            </li>
            <li>
              finds the bird by matching names, longest first. It knows the 61 species’ English, Latin and Chinese
              names, nicknames such as 麻鷹 (Black Kite) and 豬屎渣 (Oriental Magpie-Robin), the photo identifier’s
              other 312 species, and group words such as “egret” or “owl”.
            </li>
            <li>
              works out what you want to know from keyword lists, covering 9 kinds of question: overview,
              appearance, habitat, where, when, diet, behaviour, conservation and names
            </li>
            <li>builds the answer from its knowledge files</li>
          </ol>
          <p>Follow-up questions such as “Where can I see it?” use the last bird discussed.</p>
        </QAItem>

        <QAItem question="Why rule-based rather than an AI chatbot?">
          <ul>
            <li>
              <strong>No made-up facts:</strong> every answer comes from a known source and can be checked.
            </li>
            <li>
              <strong>No API keys, costs or outside services:</strong> it works offline, and your questions stay
              on your device.
            </li>
            <li>
              <strong>Easy to test:</strong> 50 sample questions check its answers automatically.
            </li>
          </ul>
          <p>The trade-off: it only understands the kinds of phrasing it has rules for.</p>
        </QAItem>

        <QAItem question="Where do its facts come from?">
          <ul>
            <li>
              <strong>When to see a bird:</strong> the share of eBird checklists that recorded it in each month,
              turned into sentences by rules.
            </li>
            <li>
              <strong>Where to see it:</strong> the trip model’s top 3 hotspots in the species’ best month.
            </li>
            <li>
              <strong>Conservation status:</strong> the global IUCN Red List category.
              <ul>
                <li>57 species come via iNaturalist, and the Scarlet Minivet via Wikipedia (citing the IUCN).</li>
                <li>
                  The two threatened species were checked against BirdLife International.
                </li>
                <li>
                  No global status exists for the Asian Tit, Amur Stonechat or Eastern Cattle-Egret under these
                  names, because bird lists draw the lines between these species differently.
                </li>
              </ul>
            </li>
            <li>
              <strong>Descriptions</strong> (appearance, habitat, diet, behaviour): short notes written for
              BirdQuest.
            </li>
          </ul>
        </QAItem>

        <QAItem question="Which birds does it cover, and what happens with others?">
          <p>
            61 species: the trip planner’s 60 plus the Black-faced Spoonbill. For any other bird it replies:
            “This chatbot currently only supports 61 species of bird, and we expect to expand in the near
            future.”
          </p>
        </QAItem>

        <QAItem question="What were the key findings?">
          <ul>
            <li>
              <strong>The Black-faced Spoonbill</strong> has been Vulnerable since 2025, after being Endangered
              from at least 2008 to 2017 (BirdLife International). Our early sample text still said Endangered,
              and we corrected it.
            </li>
            <li>
              <strong>The Collared Crow</strong> has been Vulnerable since 2018 (it was Near Threatened before).
              That’s notable for a bird that’s common in Hong Kong.
            </li>
            <li>
              <strong>The data-based seasons match known patterns:</strong> winter visitors such as the Pied
              Avocet and Northern Shoveler, and the Asian Koel’s peak from March to June, when it calls loudly.
            </li>
            <li>
              <strong>Testing:</strong> all 50 test questions pass, and every species was checked with every
              kind of question.
            </li>
          </ul>
        </QAItem>

        <QAItem question="What are its limitations?">
          <ul>
            <li>
              It matches keywords rather than understanding language, so unusual phrasing may get a general
              overview or “I didn’t understand”.
            </li>
            <li>It answers about one bird at a time, and can’t compare birds or report live sightings.</li>
            <li>The descriptions are general notes, not reviewed by an expert, so check a field guide.</li>
            <li>Conservation status is the global IUCN category, not a Hong Kong status.</li>
          </ul>
        </QAItem>
      </section>

      {/* ---------------- Overall ---------------- */}
      <section className="qa-section" aria-labelledby="qa-overall">
        <h2 id="qa-overall" className="section-title">
          Assumptions, next steps and credits
        </h2>

        <QAItem question="What are the main assumptions behind BirdQuest?">
          <ul>
            <li>eBird checklists show where and when birds are found, allowing for observers’ habits.</li>
            <li>One year of data (October 2025 to September 2026) is typical enough.</li>
            <li>People’s bird photos look like the identifier’s training photos.</li>
            <li>
              People treat the results as estimates. That’s why every chance and confidence is labelled and
              explained.
            </li>
          </ul>
        </QAItem>

        <QAItem question="How does the prototype compare with our proposal?">
          <p>We kept the proposal’s goals, but changed some methods once we had the data and models in hand.</p>
          <ul>
            <li>
              <strong>Trip planner.</strong> The proposal planned a k-nearest-neighbours model, built in KNIME and
              compared with a monthly-frequency baseline.
              <ul>
                <li>
                  We tested k-nearest neighbours as planned, but averaging a logistic regression and a small
                  neural network did better (test F1 0.718, against 0.623 for k-nearest neighbours).
                </li>
                <li>
                  Only one year of data was available, not the planned two. A date-based 60/20/20 split would
                  then have tested on summer alone, so the main results split by day of the month. The planned
                  date-based split is kept as a tougher check (F1 0.596).
                </li>
                <li>The proposed prediction map isn’t built yet; results are shown as lists.</li>
              </ul>
            </li>
            <li>
              <strong>Identifier.</strong> The proposal planned a Teachable Machine model for 10–15 Hong Kong
              species. Instead, an open-source model covers 373 species, including every bird the other two parts
              use, and runs on the device.
            </li>
            <li>
              <strong>Chatbot.</strong> The proposal planned intent classification with five kinds of query, plus
              explanations written by an AI language model.
              <ul>
                <li>
                  We built the rule-based version from the team’s role plan: intent detection, picking out the
                  bird’s name, and template answers.
                </li>
                <li>
                  Without an AI language model it can’t make up facts, and it works offline. Trip-planning
                  questions are pointed to Plan a trip.
                </li>
              </ul>
            </li>
            <li>
              <strong>Evaluation.</strong> The trip model was evaluated as planned: per-species precision, recall
              and confusion matrices against the monthly-frequency baseline. The other planned tests are still to
              do (see the next question).
            </li>
          </ul>
        </QAItem>

        <QAItem question="What would you improve next?">
          <p>Finish the evaluation the proposal planned:</p>
          <ul>
            <li>
              A blind test of the chatbot with at least 50 questions from new users, with a confusion matrix for
              its intent detection. Our 50 test questions were written by us.
            </li>
            <li>
              Test the identifier on held-out park photos and web images, reporting accuracy and a confusion
              matrix of commonly confused species.
            </li>
            <li>User acceptance testing with at least 10 students or birdwatchers.</li>
          </ul>
          <p>Then improve the prototype:</p>
          <ul>
            <li>Connect live weather forecasts for trips in the next few days.</li>
            <li>Add tide data for waterbirds around Deep Bay.</li>
            <li>Add the proposed prediction map, and show distinguishing features next to photo matches.</li>
            <li>Train the trip model on more years of data and more species.</li>
            <li>Consider training the identifier further on local Hong Kong photos.</li>
            <li>Use Hong Kong’s traditional Chinese bird names.</li>
            <li>Cover more species in the assistant, and have its descriptions reviewed by a birder.</li>
          </ul>
        </QAItem>

        <QAItem question="Credits and licences">
          <ul>
            <li>Bird records: eBird (Cornell Lab of Ornithology).</li>
            <li>
              Photo identifier:{' '}
              <a href="https://github.com/Firefly-ZJ/Bird-Classification">Bird-Classification</a> by Zhang Jun
              (MIT licence), trained on photos from iNaturalist.
            </li>
            <li>
              Species names: iNaturalist. Conservation status: IUCN Red List, via iNaturalist, Wikidata and
              Wikipedia, checked against BirdLife International.
            </li>
            <li>Software: React, Vite and onnxruntime-web (all open source).</li>
          </ul>
        </QAItem>
      </section>
    </>
  )
}
