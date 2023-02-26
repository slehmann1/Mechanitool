from tolerancestackup.models import DistributionType


def run():
    DistributionType.objects.all().delete()
    normal = DistributionType(name="Normal")
    uniform = DistributionType(name="Uniform")
    DistributionType.objects.bulk_create([normal, uniform])
    print("Built Distribution Types")
