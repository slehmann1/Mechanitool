from django.test import TestCase
from tolerancestackup.distributions import Normal, Uniform
from tolerancestackup.stackup_step import StackupStep
import numpy as np


class StackupStepTest(TestCase):
    def test_unbounded_normal(self):
        normal_dict = {
            "name": "Name",
            "number": 1,
            "distribution": "Normal",
            "mean": 1,
            "std": 5,
            "lsl": "",
            "usl": "",
        }

        distribution = Normal(
            normal_dict["mean"], normal_dict["std"]).calculate()
        self.assertAlmostEqual(np.mean(distribution), np.mean(
            StackupStep(normal_dict).calculate()), delta=0.5)
        self.assertAlmostEqual(np.std(distribution), np.std(
            StackupStep(normal_dict).calculate()), delta=0.5)

    def test_bounded_normal(self):
        normal_dict = {
            "name": "Name",
            "number": 1,
            "distribution": "Normal",
            "mean": 1,
            "std": 5,
            "lsl": 1,
            "usl": 3,
        }

        distribution = Normal(normal_dict["mean"], normal_dict["std"],
                              lower_lim=normal_dict["lsl"], upper_lim=normal_dict["usl"]).calculate()

        self.assertAlmostEqual(np.mean(distribution), np.mean(
            StackupStep(normal_dict).calculate()), delta=0.5)
        self.assertAlmostEqual(np.std(distribution), np.std(
            StackupStep(normal_dict).calculate()), delta=0.5)

        self.assertGreaterEqual(
            np.min(StackupStep(normal_dict).calculate()), normal_dict["lsl"])

        self.assertLessEqual(
            np.max(StackupStep(normal_dict).calculate()), normal_dict["usl"])

    def test_left_bounded_normal(self):
        normal_dict = {
            "name": "Name",
            "number": 1,
            "distribution": "Normal",
            "mean": 1,
            "std": 5,
            "lsl": 1,
            "usl": "",
        }

        distribution = Normal(normal_dict["mean"], normal_dict["std"],
                              lower_lim=normal_dict["lsl"]).calculate()

        self.assertAlmostEqual(np.mean(distribution), np.mean(
            StackupStep(normal_dict).calculate()), delta=0.5)
        self.assertAlmostEqual(np.std(distribution), np.std(
            StackupStep(normal_dict).calculate()), delta=0.5)

        self.assertGreaterEqual(
            np.min(StackupStep(normal_dict).calculate()), normal_dict["lsl"])

    def test_right_bounded_normal(self):
        normal_dict = {
            "name": "Name",
            "number": 1,
            "distribution": "Normal",
            "mean": 4,
            "std": 5,
            "lsl": "",
            "usl": 3,
        }

        distribution = Normal(normal_dict["mean"], normal_dict["std"],
                              upper_lim=normal_dict["usl"]).calculate()

        self.assertAlmostEqual(np.mean(distribution), np.mean(
            StackupStep(normal_dict).calculate()), delta=0.5)
        self.assertAlmostEqual(np.std(distribution), np.std(
            StackupStep(normal_dict).calculate()), delta=0.5)

        self.assertLessEqual(
            np.max(StackupStep(normal_dict).calculate()), normal_dict["usl"])

    def test_error_distribution(self):
        dist_dict = {
            "name": "Name",
            "number": 1,
            "distribution": "Incorrect Value",
            "mean": 4,
            "std": 5,
            "lsl": "",
            "usl": 3,
        }
        self.assertRaises(ValueError, StackupStep, dist_dict)
