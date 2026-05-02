from setuptools import setup, find_packages

setup(
    name="spaceship-game",
    version="1.0.0",
    author="Spaceship Developer",
    description="2D 物理飞船游戏 - 使用 Pygame + Pymunk",
    packages=find_packages(),
    install_requires=[
        "pygame>=2.5.0",
        "pymunk>=6.5.0",
        "numpy>=1.24.0",
    ],
    python_requires=">=3.8",
    entry_points={
        'console_scripts': [
            'spaceship=src.main:main',
        ],
    },
)
