import numpy as np
from scipy.stats import truncnorm
from abc import ABC, abstractmethod

# The default number of samples if no other value is specified
DEFAULT_SAMPLES = 1000


class Distribution(ABC):
    """
    An abstract class that parents all distributions
    """

    def __init__(self, name: str, num_samples: int = DEFAULT_SAMPLES, mid_length=None, lower_lim=None, upper_lim=None):
        """
        An abstract class that parents all distributions
        :param num_samples: The number of samples. Defaults to DEFAULT SAMPLES
        :param mid_length: The mid_point value for all distributions
        :param lower_lim: A cutoff at a lower limit, no cutoff applied if no value passed
        :param upper_lim: A cutoff at an upper limit, no cutoff applied if no value passed
        :param name: A string representation of the distribution
        """
        self.num_samples = num_samples
        self.lower_lim = lower_lim
        self.upper_lim = upper_lim
        self.name = name
        self.nominal_value = mid_length
        self.mean = None
        self.std = None

    def mid_length(self):
        """
        :return: The distributions medium value
        """
        return self.nominal_value

    @abstractmethod
    def calculate(self):
        """
        Returns a random sampling from the distribution in the form of a numpy array.
        :return: A randomly ordered numpy array of values
        """
        pass

    def abs_max(self):
        """
        The absolute maximum value possible in the distrbibution. May be none if not defined.
        Eg. a normal distribution without a cutoff.
        :return:
        """
        return self.upper_lim

    def abs_min(self):
        """
        The absolute minimum value possible in the distrbibution. May be none if not defined.
        Eg. a normal distribution without a cutoff.
        :return:
        """
        return self.lower_lim


class Normal(Distribution):
    """
    A class for a normal distribution
    """

    def __init__(self, mean: float, std: float, num_samples: int = DEFAULT_SAMPLES, lower_lim=None, upper_lim=None):
        """

        :param mean: The mean value for the distribution
        :param std: The standard deviation for the distribution
        :param num_samples: Optional - the number of samples within the common lengths
        :param lower_lim: A cutoff at a lower limit, no cutoff applied if no value passed
        :param upper_lim: A cutoff at an upper limit, no cutoff applied if no value passed
        """
        super().__init__("Normal", num_samples, mean, lower_lim, upper_lim)
        self.mean = mean
        self.std = std
        self.lower_lim = lower_lim
        self.upper_lim = upper_lim

    def calculate(self):
        """
        Returns a random sampling from the distribution in the form of a numpy array.
        :return: A randomly ordered numpy array of values
        """

        # Use truncated norm
        if self.lower_lim and self.upper_lim:
            return truncnorm.rvs(
                (self.lower_lim - self.mean) / self.std,
                (self.upper_lim - self.mean) / self.std,
                loc=self.mean,
                scale=self.std,
                size=self.num_samples,
            )

        elif self.lower_lim:
            return truncnorm.rvs(
                (self.lower_lim - self.mean) / self.std,
                np.inf,
                loc=self.mean,
                scale=self.std,
                size=self.num_samples,
            )

        elif self.upper_lim:
            return truncnorm.rvs(
                -np.inf,
                (self.upper_lim - self.mean) / self.std,
                loc=self.mean,
                scale=self.std,
                size=self.num_samples,
            )

        # Don't truncate
        else:
            return np.random.normal(self.mean, self.std, self.num_samples)


class Uniform(Distribution):
    """
    A class for a uniform distribution
    """

    def __init__(self, nominal: float, tolerance: float, num_samples: int = DEFAULT_SAMPLES):
        """

        :param nominal: The nominal value
        :param tolerance: The bi-directional tolerance of common lengths
        :param num_samples: The number of samples within the common lengths
        """
        super().__init__("Uniform", num_samples, nominal,
                         nominal - tolerance, nominal + tolerance)
        self.nominal = nominal
        self.tolerance = tolerance

    def calculate(self):
        """
        Returns a random sampling from the distribution in the form of a numpy array.
        :return: A randomly ordered numpy array of values
        """
        return np.random.uniform(self.nominal - self.tolerance, self.nominal + self.tolerance, self.num_samples)