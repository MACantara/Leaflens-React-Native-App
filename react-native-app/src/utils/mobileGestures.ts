import { useCallback, useState } from 'react';
import { PanResponder } from 'react-native';

const EDGE_START_X = 28;
const INTENT_DX = 22;
const TRIGGER_DX = 72;
const AXIS_TOLERANCE = 44;

export function createEdgeMenuPanResponder(params: {
  menuVisible: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
}) {
  return PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponderCapture: (_, gestureState) => {
      const fromLeftEdge = gestureState.x0 <= EDGE_START_X;
      const swipeRightIntent = fromLeftEdge && gestureState.dx > INTENT_DX && Math.abs(gestureState.dy) < AXIS_TOLERANCE;
      const swipeLeftIntent = params.menuVisible && gestureState.dx < -INTENT_DX && Math.abs(gestureState.dy) < AXIS_TOLERANCE;

      return swipeRightIntent || swipeLeftIntent;
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_, gestureState) => {
      const swipeRightFromEdge = gestureState.x0 <= EDGE_START_X + 8 && gestureState.dx > TRIGGER_DX && Math.abs(gestureState.dy) < AXIS_TOLERANCE;
      const swipeLeftToCloseMenu = params.menuVisible && gestureState.dx < -TRIGGER_DX && Math.abs(gestureState.dy) < AXIS_TOLERANCE;

      if (swipeLeftToCloseMenu) {
        params.onCloseMenu();
        return;
      }

      if (swipeRightFromEdge) {
        params.onOpenMenu();
      }
    }
  });
}

export function usePullToRefreshController() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const runInitialLoad = useCallback(async (task: () => Promise<void>): Promise<void> => {
    setLoading(true);
    try {
      await task();
    } finally {
      setLoading(false);
    }
  }, []);

  const runPullToRefresh = useCallback(async (task: () => Promise<void>): Promise<void> => {
    setRefreshing(true);
    try {
      await task();
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    loading,
    refreshing,
    runInitialLoad,
    runPullToRefresh
  };
}
