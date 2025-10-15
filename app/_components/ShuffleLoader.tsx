import React, { useEffect, useState } from "react";
import { motion, useAnimate, Transition } from "motion/react";

const NUM_BLOCKS = 5;
const BLOCK_SIZE = 32;

const DURATION_IN_MS = 175;
const DURATION_IN_SECS = DURATION_IN_MS * 0.001;

const ANIMATE_TRANSITION = {
  ease: "easeInOut" as const,
  duration: DURATION_IN_SECS,
};

const MOTION_TRANSITION: Transition = {
  ease: "easeInOut",
  duration: DURATION_IN_SECS,
};

interface Block {
  id: number;
}

export default function ShuffleLoader() {
  const [blocks, setBlocks] = useState<Block[]>(Array.from(Array(NUM_BLOCKS).keys()).map((n) => ({ id: n })));
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    shuffle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shuffle = async () => {
    while (true) {
      const [first, second] = pickTwoRandom();

      animate(`[data-block-id="${first.id}"]`, { y: -BLOCK_SIZE }, ANIMATE_TRANSITION);

      await animate(`[data-block-id="${second.id}"]`, { y: BLOCK_SIZE }, ANIMATE_TRANSITION);

      await delay(DURATION_IN_MS);

      setBlocks((pv) => {
        const copy = [...pv];

        const indexForFirst = copy.indexOf(first);
        const indexForSecond = copy.indexOf(second);

        copy[indexForFirst] = second;
        copy[indexForSecond] = first;

        return copy;
      });

      await delay(DURATION_IN_MS * 2);

      animate(`[data-block-id="${first.id}"]`, { y: 0 }, ANIMATE_TRANSITION);

      await animate(`[data-block-id="${second.id}"]`, { y: 0 }, ANIMATE_TRANSITION);

      await delay(DURATION_IN_MS);
    }
  };

  const pickTwoRandom = (): [Block, Block] => {
    const index1 = Math.floor(Math.random() * blocks.length);
    let index2 = Math.floor(Math.random() * blocks.length);

    while (index2 === index1) {
      index2 = Math.floor(Math.random() * blocks.length);
    }

    return [blocks[index1], blocks[index2]];
  };

  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  return (
    <div ref={scope} className="flex divide-x divide-neutral-950">
      {blocks.map((b) => {
        return (
          <motion.div
            layout
            data-block-id={b.id}
            key={b.id}
            transition={MOTION_TRANSITION}
            style={{
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
            }}
            className="bg-white"
          />
        );
      })}
    </div>
  );
}
