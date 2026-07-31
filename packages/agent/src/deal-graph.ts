import {
  evaluatePromotion,
  type PromotionEvaluation,
  type PromotionExtraction,
  type ShoppingIntentInput,
} from "@comprador/core";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";

import type { PromotionExtractor, PromotionMessageInput } from "./extractor";

const DealState = Annotation.Root({
  message: Annotation<PromotionMessageInput>(),
  comparableDiscounts: Annotation<number[]>(),
  intents: Annotation<ShoppingIntentInput[]>(),
  extraction: Annotation<PromotionExtraction | null>(),
  evaluation: Annotation<PromotionEvaluation | null>(),
  model: Annotation<string | null>(),
});

export type DealGraphInput = {
  message: PromotionMessageInput;
  comparableDiscounts?: number[];
  intents?: ShoppingIntentInput[];
};

export type DealGraphResult = {
  extraction: PromotionExtraction;
  evaluation: PromotionEvaluation | null;
  model: string;
};

export type DealContextLoader = (extraction: PromotionExtraction) => Promise<{
  comparableDiscounts: number[];
  intents: ShoppingIntentInput[];
}>;

export function createDealEvaluationGraph(
  extractor: PromotionExtractor,
  loadContext?: DealContextLoader,
) {
  return new StateGraph(DealState)
    .addNode("extract", async (state) => {
      const result = await extractor.extract(state.message);
      return {
        extraction: result.extraction,
        model: result.model,
      };
    })
    .addNode("evaluate", (state) => {
      if (!state.extraction) {
        throw new Error("Promotion extraction is missing");
      }
      return {
        evaluation: evaluatePromotion({
          extraction: state.extraction,
          comparableDiscounts: state.comparableDiscounts,
          intents: state.intents,
        }),
      };
    })
    .addNode("load_context", async (state) => {
      if (!state.extraction || !loadContext) {
        return {};
      }
      return loadContext(state.extraction);
    })
    .addEdge(START, "extract")
    .addConditionalEdges("extract", (state) =>
      state.extraction?.isPromotion &&
      state.extraction.sensitivity === "promotional"
        ? "load_context"
        : END,
    )
    .addEdge("load_context", "evaluate")
    .addEdge("evaluate", END)
    .compile();
}

export async function evaluateDeal(
  extractor: PromotionExtractor,
  input: DealGraphInput,
  loadContext?: DealContextLoader,
): Promise<DealGraphResult> {
  const graph = createDealEvaluationGraph(extractor, loadContext);
  const result = await graph.invoke({
    message: input.message,
    comparableDiscounts: input.comparableDiscounts ?? [],
    intents: input.intents ?? [],
    extraction: null,
    evaluation: null,
    model: null,
  });

  if (!result.extraction || !result.model) {
    throw new Error("Deal graph completed without an extraction");
  }

  return {
    extraction: result.extraction,
    evaluation: result.evaluation,
    model: result.model,
  };
}
