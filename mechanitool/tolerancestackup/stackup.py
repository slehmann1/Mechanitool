import numpy as np
import tolerancestackup.distributions as distributions
from tolerancestackup.stackup_step import StackupStep
import tolerancestackup.models as md


class Stackup:

    def __init__(self, stackup_dict: dict = None, revision: str = None, name: str = None, author: str = None, description: str = None, num_samples: int = distributions.DEFAULT_SAMPLES):
        """Creates a stackup, consisting of a series of stackup steps

        Args:
            stackup_dict (dict, optional): A dictionary containing stackup step data. Defaults to None.
            revision (str, optional): Revision Number. Defaults to "01".
            num_samples (int, optional): Number of samples to be generated. Defaults to distributions.DEFAULT_SAMPLES.
        """
        self.stackup_steps = []
        self.revision = revision
        self.name = name
        self.author = author
        self.description = description
        self.num_samples = num_samples

        # TODO: Data validation
        for value in stackup_dict.values():
            self.add_step(StackupStep(value))

    def add_step(self, stackup_step: StackupStep):
        """
        Adds a step to the stackup.

        :param stackup_step: An instance of ``StackupStep``
        :return: None
        """
        stackup_step.set_num_samples(self.num_samples)
        self.stackup_steps.append(stackup_step)

    def _calculate_stack_steps(self):
        """
        Calculates all distributions within the stack
        :return: None
        """
        for stackup_step in self.stackup_steps:
            stackup_step.calculate()

    def calc_stack(self):
        """
        Computes the overall distribution, summing each step in the stackup
        :return: A sorted numpy array of length values
        """
        num_of_steps = len(self.stackup_steps)
        self._calculate_stack_steps()

        self.values = np.zeros(self.num_samples)
        for i in range(num_of_steps):
            self.values += self.stackup_steps[i].calculate()

        self.values.sort()

        return self.values

    def gen_models(self):

        stackup = md.Stackup()

        if self.name:
            stackup.name = self.name[:49]
        if self.author:
            stackup.author = self.author[:29]
        if self.description:
            stackup.description = self.description[:199]
        if self.revision:
            stackup.revision = self.revision[:9]

        stackup_steps = [stackup_step.to_model(stackup)
                         for stackup_step in self.stackup_steps]

        stackup.save()
        md.StackupStep.objects.bulk_create(stackup_steps)

        return stackup.id
