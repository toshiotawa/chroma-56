// Two-note OOB hard-negative patch.
// Loaded after app.js. It keeps the main app simple while narrowing OOB to
// musically confusing pairs: same interval class, one shared target note, and
// semitone-parallel copies of the target pair.
(() => {
  const normalizePitchClass = (pitchClass) => (pitchClass + 12) % 12;
  const midiFor = (pitchClass, octave) => (octave + 1) * 12 + pitchClass;
  const placementKey = (pair, octaves) => `${pair.join(":")}@${octaves.join(":")}`;

  function intervalClassOf(pair) {
    const directed = normalizePitchClass(pair[1] - pair[0]);
    return Math.min(directed, 12 - directed);
  }

  function confusingOobPairsForTarget(targetPair, enabledPairs) {
    const intervalClass = intervalClassOf(targetPair);
    if (intervalClass <= 0) return [];

    const targetKey = normalizedPairKey(targetPair);
    const anchoredCandidates = targetPair.flatMap((anchor) => [-1, 1].map((direction) => [
      anchor,
      normalizePitchClass(anchor + direction * intervalClass)
    ]));
    const parallelCandidates = [
      transposePair(targetPair, -1),
      transposePair(targetPair, 1)
    ];

    return uniquePairs([...anchoredCandidates, ...parallelCandidates])
      .filter((pair) => normalizedPairKey(pair) !== targetKey)
      .filter((pair) => classifyTwoNotePair(pair, enabledPairs) === "OOB");
  }

  function confusingOobPairsForDay(day) {
    const currentPairCandidates = confusingOobPairsForTarget(day.newPair, day.enabledPairs);
    if (currentPairCandidates.length) return currentPairCandidates;

    // Late stages can unlock the immediate traps for the new pair. In that case,
    // preserve the same drill shape using the newest review pair that still has
    // confusing OOB neighbors.
    return uniquePairs([...day.enabledPairs].reverse().flatMap((pair) =>
      confusingOobPairsForTarget(pair, day.enabledPairs)
    ));
  }

  function bassOrderedVariant(pair, bassIndex, preferredBassOctave) {
    const bassPitch = pair[bassIndex];
    const upperPitch = pair[1 - bassIndex];
    let bassOctave = preferredBassOctave;
    let upperOctave = preferredBassOctave;

    while (midiFor(upperPitch, upperOctave) <= midiFor(bassPitch, bassOctave)) {
      upperOctave += 1;
    }

    // Keep the generated inversion inside the 3-5 octave curriculum where possible.
    while (upperOctave > 5 && bassOctave > 3) {
      bassOctave -= 1;
      upperOctave -= 1;
    }

    return {
      pair: [bassPitch, upperPitch],
      octaves: [bassOctave, upperOctave]
    };
  }

  function pairPlacementVariants(pair, octaves) {
    const variants = [];
    const seen = new Set();
    const add = (candidatePair, candidateOctaves) => {
      const key = placementKey(candidatePair, candidateOctaves);
      if (seen.has(key)) return;
      seen.add(key);
      variants.push({ pair: candidatePair, octaves: candidateOctaves });
    };

    // Keep the authored placement, then guarantee both bass orientations.
    add([...pair], [...octaves]);
    const firstAsBass = bassOrderedVariant(pair, 0, octaves[0]);
    const secondAsBass = bassOrderedVariant(pair, 1, octaves[1]);
    add(firstAsBass.pair, firstAsBass.octaves);
    add(secondAsBass.pair, secondAsBass.octaves);
    return variants;
  }

  // Replace broad OOB enumeration with the deliberately confusing set only.
  oobPairsFor = function patchedOobPairsFor(day) {
    return confusingOobPairsForDay(day);
  };

  adjacentMatchedOobPairsFor = function patchedAdjacentMatchedOobPairsFor(day) {
    return confusingOobPairsForDay(day);
  };

  buildTwoNoteSectionDeck = function patchedBuildTwoNoteSectionDeck(day, mix) {
    const count = mix.count;
    const { recentPairs, oldPairs } = splitReviewPairs(day.enabledPairs, day.newPair);
    const hardOobPairs = confusingOobPairsForDay(day);
    const oobCount = hardOobPairs.length ? Math.round(count * mix.oob) : 0;
    const targetCount = count - oobCount;
    const allocations = allocateSectionTargets(targetCount, mix, {
      new: [day.newPair],
      recent: recentPairs,
      old: oldPairs
    });
    const trials = allocations.flatMap(({ item, count: allocationCount }) => {
      if (item.key === "new") return buildPairTrials(allocationCount, [day.newPair], day.placements, day.enabledPairs, "newPair");
      if (item.key === "recent") return buildPairTrials(allocationCount, item.items, day.placements, day.enabledPairs, "recentPair");
      return buildPairTrials(allocationCount, item.items, day.placements, day.enabledPairs, "oldPair");
    });

    if (oobCount > 0) {
      trials.push(...buildOobPairTrials(oobCount, hardOobPairs, day, "sameIntervalHardOob"));
    }
    return shuffle(trials);
  };

  buildPairTrials = function patchedBuildPairTrials(count, pairs, placements, enabledPairs, trialType) {
    if (!pairs.length || count <= 0) return [];
    const base = pairs.flatMap((pair) => placements.flatMap((octaves) =>
      pairPlacementVariants(pair, octaves)
    ));
    const deck = [];
    while (deck.length < count) deck.push(...shuffle(base));
    return deck.slice(0, count).map(({ pair, octaves }) =>
      makeTwoNoteTrial([...pair], [...octaves], enabledPairs, trialType)
    );
  };

  const originalBuildExportPayload = buildExportPayload;
  buildExportPayload = function patchedBuildExportPayload(options = {}) {
    const payload = originalBuildExportPayload(options);
    if (selectedMode === "double") {
      const hardOobPairs = confusingOobPairsForDay(selectedDay);
      payload.task.oobPitches = [...new Set(hardOobPairs.flat())].map(displayNote);
      payload.task.oobRule = "解禁済みペア集合にない2音ペアのうち、現在のターゲットと同じインターバルクラスを持つ片音共有型と半音平行移動型だけをOOBとして出題";
      payload.task.sameIntervalHardOobPairs = hardOobPairs.map((pair) => pair.map(displayNote));
      payload.task.adjacentSameIntervalClassOobPairs = hardOobPairs.map((pair) => pair.map(displayNote));
    }
    return payload;
  };
})();
