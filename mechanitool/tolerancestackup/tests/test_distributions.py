from django.test import TestCase
from tolerancestackup.distributions import Normal, Uniform
import numpy as np


class DistributionsTest(TestCase):
    def test_normal(self):
        normal = Normal(2, 5)
        normal_vals = normal.calculate()

        self.assertAlmostEqual(np.mean(normal_vals), 2.0, delta=0.5)
        self.assertAlmostEqual(np.std(normal_vals), 5.0, delta=0.5)

    def test_truncated_normal(self):
        # Check distribution shape
        truncated = Normal(2, 5, lower_lim=-50, upper_lim=50)
        truncated_vals = truncated.calculate()
        self.assertAlmostEqual(np.mean(truncated_vals), 2.0, delta=0.5)
        self.assertAlmostEqual(np.std(truncated_vals), 5.0, delta=0.5)

        # Check limits: Both sided
        truncated = Normal(2, 5, lower_lim=0.5, upper_lim=1.5)
        truncated_vals = truncated.calculate()
        self.assertTrue(np.min(truncated_vals) >= 0.5)
        self.assertTrue(np.max(truncated_vals) <= 1.5)

        # Check limits: Left sided
        truncated = Normal(2, 5, lower_lim=0.5)
        truncated_vals = truncated.calculate()
        self.assertTrue(np.min(truncated_vals) >= 0.5)

        # Check limits: Right sided
        truncated = Normal(2, 5, upper_lim=0.5)
        truncated_vals = truncated.calculate()
        self.assertTrue(np.max(truncated_vals) <= 0.5)

    def test_uniform(self):
        lsl = -10
        usl = 10
        
        uniform = Uniform((lsl+usl)/2, (usl-lsl)/2)
        uniform_vals = uniform.calculate()

        self.assertGreaterEqual(np.min(uniform_vals), lsl)
        self.assertLessEqual(np.max(uniform_vals), usl)
        self.assertAlmostEqual(np.mean(uniform_vals), (lsl+usl)/2, delta = 0.5)
        self.assertAlmostEqual(np.std(uniform_vals), (((usl-lsl)**2)/12)**0.5, delta = 0.5)
