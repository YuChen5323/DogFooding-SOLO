import {
  HStack,
  Button,
  Tooltip,
  Box,
  useMediaQuery,
} from '@chakra-ui/react';
import { useAppSelector, useAppDispatch } from '../store';
import { selectTool } from '../store/slices/uiSlice';
import { openMenu } from '../store/slices/uiSlice';

const tools = [
  { id: 'hoe', name: '锄头', emoji: '⛏️', key: '1', desc: '耕地使用' },
  { id: 'watering_can', name: '水壶', emoji: '💧', key: '2', desc: '浇水使用' },
  { id: 'seed', name: '种子', emoji: '🌱', key: '3', desc: '种植使用' },
  { id: 'hammer', name: '锤子', emoji: '🔨', key: '4', desc: '清除/收获' },
];

const quickMenus = [
  { id: 'inventory', name: '背包', emoji: '🎒', key: 'I' },
  { id: 'shop', name: '商店', emoji: '🏪', key: 'S' },
  { id: 'barn', name: '畜牧', emoji: '🐄', key: 'B' },
  { id: 'kitchen', name: '厨房', emoji: '🍳', key: 'K' },
  { id: 'achievements', name: '成就', emoji: '🏆', key: 'A' },
];

const Toolbar = () => {
  const dispatch = useAppDispatch();
  const selectedTool = useAppSelector((state) => state.ui.selectedTool);
  const [isLargerThanMd] = useMediaQuery('(min-width: 768px)');

  const handleToolSelect = (toolId: string) => {
    dispatch(selectTool(toolId));
  };

  const handleMenuOpen = (menuId: string) => {
    dispatch(openMenu(menuId as any));
  };

  return (
    <Box
      position="absolute"
      bottom={4}
      left="50%"
      transform="translateX(-50%)"
      pointerEvents="auto"
    >
      <HStack spacing={2} align="center">
        <Box
          bg="pixel.50"
          border="4px solid"
          borderColor="pixel.500"
          boxShadow="4px 4px 0px #00000040"
          p={2}
        >
          <HStack spacing={1}>
            {tools.map((tool) => (
              <Tooltip
                key={tool.id}
                label={`${tool.name} (${tool.key}) - ${tool.desc}`}
                placement="top"
              >
                <Button
                  size={isLargerThanMd ? 'md' : 'sm'}
                  fontSize="2xl"
                  bg={selectedTool === tool.id ? 'pixel.400' : 'pixel.200'}
                  color={selectedTool === tool.id ? 'white' : 'pixel.800'}
                  border={selectedTool === tool.id ? '4px solid' : '3px solid'}
                  borderColor={selectedTool === tool.id ? 'pixel.600' : 'pixel.400'}
                  boxShadow={selectedTool === tool.id ? 'inset 2px 2px 0px #00000030' : 'none'}
                  borderRadius={0}
                  _hover={{
                    bg: selectedTool === tool.id ? 'pixel.400' : 'pixel.300',
                  }}
                  onClick={() => handleToolSelect(tool.id)}
                >
                  {tool.emoji}
                </Button>
              </Tooltip>
            ))}
          </HStack>
        </Box>

        <Box
          bg="pixel.50"
          border="4px solid"
          borderColor="pixel.500"
          boxShadow="4px 4px 0px #00000040"
          p={2}
        >
          <HStack spacing={1}>
            {quickMenus.map((menu) => (
              <Tooltip
                key={menu.id}
                label={`${menu.name} (${menu.key})`}
                placement="top"
              >
                <Button
                  size={isLargerThanMd ? 'md' : 'sm'}
                  fontSize="lg"
                  bg="pixel.100"
                  color="pixel.800"
                  border="3px solid"
                  borderColor="pixel.400"
                  borderRadius={0}
                  _hover={{
                    bg: 'pixel.200',
                    transform: 'translate(-1px, -1px)',
                    boxShadow: '2px 2px 0px #00000030',
                  }}
                  _active={{
                    bg: 'pixel.300',
                    transform: 'translate(1px, 1px)',
                  }}
                  onClick={() => handleMenuOpen(menu.id)}
                >
                  {menu.emoji}
                </Button>
              </Tooltip>
            ))}
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
};

export default Toolbar;
