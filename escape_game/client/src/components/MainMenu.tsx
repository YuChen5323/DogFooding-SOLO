import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Input,
  FormControl,
  FormLabel,
  Divider,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Container
} from '@chakra-ui/react';
import { useAtom, useSetAtom } from 'jotai';
import { userAtom, tokenAtom } from '../store/atoms';
import { apiService } from '../services/api';

interface MainMenuProps {
  onStartGame: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  const [user, setUser] = useAtom(userAtom);
  const setToken = useSetAtom(tokenAtom);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.login(loginForm.email, loginForm.password);
      setToken(response.token);
      apiService.setToken(response.token);
      setUser(response.user);
      setShowLogin(false);
      toast({
        title: '登录成功',
        description: `欢迎回来，${response.user.username}！`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: '登录失败',
        description: error.response?.data?.message || '请检查邮箱和密码',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: '密码不匹配',
        description: '请确认两次输入的密码一致',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.register(
        registerForm.username,
        registerForm.email,
        registerForm.password
      );
      setToken(response.token);
      apiService.setToken(response.token);
      setUser(response.user);
      setShowRegister(false);
      toast({
        title: '注册成功',
        description: `欢迎，${response.user.username}！`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: '注册失败',
        description: error.response?.data?.message || '请检查输入的信息',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    apiService.setToken(null);
    toast({
      title: '已登出',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box
      w="100vw"
      h="100vh"
      bg="dark.900"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="0"
        left="0"
        w="full"
        h="full"
        bgGradient="radial(circle at center, dark.700 0%, dark.900 70%)"
      />

      <Box
        position="absolute"
        top="0"
        left="0"
        w="full"
        h="full"
        opacity="0.1"
        bgImage="repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(255, 166, 0, 0.05) 10px,
          rgba(255, 166, 0, 0.05) 20px
        )"
      />

      <Container
        maxW="container.md"
        h="full"
        position="relative"
        zIndex="1"
        display="flex"
        flexDirection="column"
        justifyContent="center"
      >
        <VStack spacing={12} mb={12}>
          <VStack spacing={4}>
            <Text fontSize="6xl" textAlign="center">
              🏚️
            </Text>
            <Heading
              size="3xl"
              bgGradient="linear(to-r, accent.400, accent.600)"
              bgClip="text"
              textAlign="center"
            >
              暗影密室
            </Heading>
            <Text color="gray.400" textAlign="center" fontSize="lg">
              探索古老宅邸的秘密，找到逃出生天的方法...
            </Text>
          </VStack>

          <VStack spacing={4} w="full" maxW="300px">
            <Button
              w="full"
              size="lg"
              variant="solid"
              fontSize="xl"
              py={8}
              onClick={() => onStartGame()}
            >
              🎮 开始新游戏
            </Button>

            {user && (
              <Button
                w="full"
                size="lg"
                variant="outline"
                fontSize="lg"
                py={6}
              >
                📂 继续游戏
              </Button>
            )}

            <Divider borderColor="dark.500" w="full" my={2} />

            {user ? (
              <VStack spacing={3} w="full">
                <HStack>
                  <Text color="accent.400">👤</Text>
                  <Text color="gray.300">{user.username}</Text>
                </HStack>
                <Button
                  w="full"
                  variant="ghost"
                  colorScheme="orange"
                  onClick={handleLogout}
                >
                  登出
                </Button>
              </VStack>
            ) : (
              <HStack w="full" justify="center" spacing={4}>
                <Button
                  variant="outline"
                  colorScheme="orange"
                  onClick={() => setShowLogin(true)}
                >
                  登录
                </Button>
                <Button
                  variant="solid"
                  colorScheme="orange"
                  onClick={() => setShowRegister(true)}
                >
                  注册
                </Button>
              </HStack>
            )}
          </VStack>
        </VStack>

        <Box position="absolute" bottom="20px" left="50%" transform="translateX(-50%)">
          <Text color="gray.600" fontSize="sm">
            版本 1.0.0 | 按任意键开始
          </Text>
        </Box>
      </Container>

      <Modal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        isCentered
      >
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Text fontSize="2xl">🔐</Text>
              <Heading size="md" color="accent.400">登录</Heading>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>邮箱</FormLabel>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>密码</FormLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowLogin(false)}>
              取消
            </Button>
            <Button
              variant="solid"
              isLoading={isLoading}
              onClick={handleLogin}
            >
              登录
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        isCentered
      >
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Text fontSize="2xl">✏️</Text>
              <Heading size="md" color="accent.400">注册</Heading>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>用户名</FormLabel>
                <Input
                  placeholder="你的昵称"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>邮箱</FormLabel>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>密码</FormLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>确认密码</FormLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowRegister(false)}>
              取消
            </Button>
            <Button
              variant="solid"
              isLoading={isLoading}
              onClick={handleRegister}
            >
              注册
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
